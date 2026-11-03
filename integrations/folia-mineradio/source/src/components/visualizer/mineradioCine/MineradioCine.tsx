import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import type { VisualizerSharedProps } from '../definition';
import { CineCamera, CineParticles, CinematicLyrics, PlaylistShelf } from './scene';
import './cine.css';

type WeatherReading = {
    city: string;
    temperature: number;
    code: number;
    isDay: boolean;
};

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LOCATION = { city: '上海', latitude: 31.2304, longitude: 121.4737 };

const weatherLabel = (code: number, isDay: boolean) => {
    if (code === 0) return isDay ? 'CLEAR' : 'STARRY';
    if (code <= 3) return 'CLOUD DRIFT';
    if (code <= 48) return 'MIST RADIO';
    if (code <= 67) return 'RAIN TAPES';
    if (code <= 77) return 'SNOW GLOW';
    if (code <= 82) return 'RAIN TAPES';
    if (code <= 86) return 'SNOW GLOW';
    return 'STORM SIGNAL';
};

const readWeather = async (location: { city: string; latitude: number; longitude: number }, signal?: AbortSignal) => {
    const url = new URL(WEATHER_ENDPOINT);
    url.search = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: 'temperature_2m,weather_code,is_day',
        timezone: 'auto',
    }).toString();
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('Weather unavailable');
    const payload = await response.json();
    return {
        city: location.city,
        temperature: Math.round(payload.current.temperature_2m),
        code: Number(payload.current.weather_code),
        isDay: payload.current.is_day === 1,
    } satisfies WeatherReading;
};

const isLiteDevice = () => {
    const extendedNavigator = navigator as Navigator & {
        connection?: { saveData?: boolean };
        deviceMemory?: number;
    };
    return window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches
        || Boolean(extendedNavigator.connection?.saveData)
        || (typeof extendedNavigator.deviceMemory === 'number' && extendedNavigator.deviceMemory <= 4);
};

const MineradioCine: React.FC<VisualizerSharedProps> = (props) => {
    const {
        theme,
        audioBands,
        audioPower,
        currentTime,
        lines,
        currentLineIndex,
        paused,
        songTitle,
        songArtist,
        coverUrl,
        playlists = [],
        onOpenPlaylist,
        songHandoff,
        showText = true,
    } = props;
    const [lite, setLite] = useState(true);
    const [weather, setWeather] = useState<WeatherReading | null>(null);
    const [weatherState, setWeatherState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [locationName, setLocationName] = useState(DEFAULT_LOCATION.city);
    const timeRef = useRef<HTMLDivElement | null>(null);
    const weatherRequest = useRef(0);

    useEffect(() => {
        const syncTime = () => {
            if (!timeRef.current) return;
            const seconds = Math.max(0, currentTime.get());
            const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
            const remainder = (Math.floor(seconds) % 60).toString().padStart(2, '0');
            timeRef.current.innerHTML = `${minutes}<span>:</span>${remainder}`;
        };
        syncTime();
        const timer = window.setInterval(syncTime, 250);
        return () => window.clearInterval(timer);
    }, [currentTime]);

    useEffect(() => {
        setLite(isLiteDevice());
        const media = window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)');
        const sync = () => setLite(isLiteDevice());
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 8000);
        readWeather(DEFAULT_LOCATION, controller.signal).then(result => {
            window.clearTimeout(timeout);
            setWeather(result);
            setWeatherState('ready');
        }).catch(() => {
            window.clearTimeout(timeout);
            setWeatherState('error');
        });
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    const requestLocalWeather = () => {
        if (!navigator.geolocation) {
            setWeatherState('error');
            return;
        }
        const requestId = weatherRequest.current + 1;
        weatherRequest.current = requestId;
        setWeatherState('loading');
        navigator.geolocation.getCurrentPosition(position => {
            if (weatherRequest.current !== requestId) return;
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 8000);
            const location = {
                city: '当前位置',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            setLocationName(location.city);
            readWeather(location, controller.signal).then(result => {
                window.clearTimeout(timeout);
                if (weatherRequest.current !== requestId) return;
                setWeather(result);
                setWeatherState('ready');
            }).catch(() => {
                window.clearTimeout(timeout);
                if (weatherRequest.current !== requestId) return;
                setWeatherState('error');
            });
        }, () => {
            if (weatherRequest.current === requestId) setWeatherState('error');
        }, { timeout: 8000, maximumAge: 600000 });
    };

    const playlistItems = useMemo(
        () => playlists.filter(playlist => playlist.type === 'playlist').slice(0, 9),
        [playlists],
    );
    const totalPlaylists = useMemo(
        () => playlists.filter(playlist => playlist.type === 'playlist').length,
        [playlists],
    );
    const hasLyrics = lines.length > 0;
    const activeSong = songHandoff && songHandoff.lines.length ? songHandoff : null;
    const palette = useMemo(() => ({
        accent: theme.accentColor || theme.primaryColor,
        primary: theme.primaryColor,
        secondary: theme.secondaryColor,
        background: theme.backgroundColor,
    }), [theme.accentColor, theme.backgroundColor, theme.primaryColor, theme.secondaryColor]);
    const reducedMotion = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        [],
    );

    return (
        <div
            className={`cine-stage${lite ? ' cine-stage-lite' : ''}`}
            style={{
                '--cine-accent': palette.accent,
                '--cine-primary': palette.primary,
                '--cine-secondary': palette.secondary,
                '--cine-bg': palette.background,
            } as React.CSSProperties}
            data-testid="cine-stage"
        >
            <Canvas
                dpr={lite ? [1, 1.15] : [1, 1.75]}
                camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 80 }}
                gl={{ alpha: true, antialias: !lite, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false }}
                frameloop={paused || reducedMotion ? 'demand' : 'always'}
                fallback={<div className="cine-webgl-fallback">当前设备不支持 WebGL，已降级为静态歌词模式</div>}
                aria-label="Cinematic music visualizer"
            >
                <ambientLight intensity={0.75} />
                <CineCamera audioBands={audioBands} audioPower={audioPower} paused={!!paused} lite={lite} />
                <CineParticles audioBands={audioBands} audioPower={audioPower} paused={!!paused} lite={lite} accent={palette.accent} />
                {showText && <CinematicLyrics lines={activeSong ? activeSong.lines : lines} currentLineIndex={activeSong ? -1 : currentLineIndex} />}
                {!lite && (
                    <PlaylistShelf
                        playlists={playlistItems}
                        onSelect={onOpenPlaylist}
                    />
                )}
            </Canvas>

            <div className="cine-grain" aria-hidden="true" />
            <header className="cine-topline">
                <div className="cine-brand"><span className="cine-brand-mark" />FOLIA / CINE STAGE</div>
                <div className="cine-weather" data-state={weatherState}>
                    <span className="cine-weather-label">WEATHER RADIO</span>
                    <span className="cine-weather-reading">
                        {weather ? `${weather.temperature}° · ${weatherLabel(weather.code, weather.isDay)}` : weatherState === 'error' ? 'OFFLINE' : 'TUNING'}
                    </span>
                    <span className="cine-weather-city">{weather?.city || locationName}</span>
                    <button type="button" onClick={requestLocalWeather} aria-label="使用当前位置获取天气">LOCATE</button>
                </div>
            </header>

            <div className="cine-track-label" aria-live="polite">
                <span>{songArtist || 'NOW PLAYING'}</span>
                <strong>{activeSong ? activeSong.songTitle || 'Incoming track' : songTitle || '等待播放'}</strong>
            </div>

            {!lite && (
                <div className="cine-shelf-caption">
                    {playlistItems.length > 0 ? (
                        <>
                            <span>PLAYLISTS / {String(totalPlaylists).padStart(2, '0')}</span>
                            <small>{totalPlaylists > 9 ? `显示前 9 个，共 ${totalPlaylists} 个歌单` : 'OPEN A COLLECTION'}</small>
                        </>
                    ) : (
                        <>
                            <span>PLAYLISTS / --</span>
                            <small>登录后可显示你的歌单</small>
                        </>
                    )}
                </div>
            )}

            {showText && !hasLyrics && !activeSong && (
                <div className="cine-lyric-empty" aria-hidden="true">暂无歌词 · 播放歌曲后自动显示</div>
            )}

            <div className="cine-time" ref={timeRef} aria-label="播放时间">00<span>:</span>00</div>
            <img className="cine-cover-sample" src={coverUrl || undefined} alt="" aria-hidden="true" />
        </div>
    );
};

export default MineradioCine;
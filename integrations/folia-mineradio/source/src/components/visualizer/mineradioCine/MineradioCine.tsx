import React, { useEffect, useMemo, useState } from 'react';
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
const DEFAULT_LOCATION = { city: 'Shanghai', latitude: 31.2304, longitude: 121.4737 };

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

const readWeather = async (location: { city: string; latitude: number; longitude: number }) => {
    const url = new URL(WEATHER_ENDPOINT);
    url.search = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: 'temperature_2m,weather_code,is_day',
        timezone: 'auto',
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
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
    } = props;
    const [lite, setLite] = useState(true);
    const [weather, setWeather] = useState<WeatherReading | null>(null);
    const [weatherState, setWeatherState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [locationName, setLocationName] = useState(DEFAULT_LOCATION.city);
    const [displayTime, setDisplayTime] = useState(0);

    useEffect(() => {
        const syncTime = () => setDisplayTime(currentTime.get());
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
        let cancelled = false;
        readWeather(DEFAULT_LOCATION).then(result => {
            if (cancelled) return;
            setWeather(result);
            setWeatherState('ready');
        }).catch(() => {
            if (!cancelled) setWeatherState('error');
        });
        return () => { cancelled = true; };
    }, []);

    const requestLocalWeather = () => {
        if (!navigator.geolocation) {
            setWeatherState('error');
            return;
        }
        setWeatherState('loading');
        navigator.geolocation.getCurrentPosition(position => {
            const location = {
                city: 'LOCAL',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            setLocationName(location.city);
            readWeather(location).then(result => {
                setWeather(result);
                setWeatherState('ready');
            }).catch(() => setWeatherState('error'));
        }, () => setWeatherState('error'), { timeout: 8000, maximumAge: 600000 });
    };

    const playlistItems = useMemo(
        () => playlists.filter(playlist => playlist.type === 'playlist').slice(0, 9),
        [playlists],
    );
    const palette = useMemo(() => ({
        accent: theme.accentColor || theme.primaryColor,
        primary: theme.primaryColor,
        secondary: theme.secondaryColor,
        background: theme.backgroundColor,
    }), [theme.accentColor, theme.backgroundColor, theme.primaryColor, theme.secondaryColor]);

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
                gl={{ alpha: true, antialias: !lite, powerPreference: 'low-power' }}
                frameloop={paused ? 'demand' : 'always'}
                aria-label="Cinematic music visualizer"
            >
                <ambientLight intensity={0.75} />
                <CineCamera audioBands={audioBands} audioPower={audioPower} paused={!!paused} lite={lite} />
                <CineParticles audioBands={audioBands} audioPower={audioPower} lite={lite} accent={palette.accent} />
                <CinematicLyrics lines={lines} currentLineIndex={currentLineIndex} />
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
                    <button type="button" onClick={requestLocalWeather} aria-label="Use current location for weather">LOCATE</button>
                </div>
            </header>

            <div className="cine-track-label" aria-live="polite">
                <span>{songArtist || 'NOW PLAYING'}</span>
                <strong>{songTitle || 'Waiting for a track'}</strong>
            </div>

            {!lite && playlistItems.length > 0 && (
                <div className="cine-shelf-caption">
                    <span>PLAYLISTS / {String(playlistItems.length).padStart(2, '0')}</span>
                    <small>OPEN A COLLECTION</small>
                </div>
            )}

            <div className="cine-time" aria-label="Playback time">
                {Math.floor(Math.max(0, displayTime) / 60).toString().padStart(2, '0')}
                <span>:</span>
                {(Math.floor(Math.max(0, displayTime)) % 60).toString().padStart(2, '0')}
            </div>
            <img className="cine-cover-sample" src={coverUrl || undefined} alt="" aria-hidden="true" />
        </div>
    );
};

export default MineradioCine;
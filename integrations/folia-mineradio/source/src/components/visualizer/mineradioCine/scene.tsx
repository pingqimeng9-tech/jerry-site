import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Line } from '../../../types';
import type { ProviderCollection } from '../../../types/onlineMusic';
import { beatImpact, downbeatImpact } from '../../../stores/motionSignals';

interface AudioSceneProps {
    audioBands: AudioBands;
    audioPower: MotionValue<number>;
}

interface CameraProps extends AudioSceneProps {
    paused: boolean;
    lite: boolean;
}

export const CineCamera: React.FC<CameraProps> = ({ audioBands, audioPower, paused, lite }) => {
    const { camera, clock } = useThree();
    const envelope = useRef(0);
    const priorPower = useRef(0);
    useFrame((_state, delta) => {
        if (paused) return;
        const dt = Math.min(delta, 0.05);
        const bass = audioBands.bass.get() / 255;
        const power = audioPower.get() / 255;
        const spectrum = audioBands.spectrum?.get() ?? new Uint8Array(0);
        let spectralAir = 0;
        for (let bin = Math.floor(spectrum.length * 0.62); bin < spectrum.length; bin += 8) {
            spectralAir += spectrum[bin] || 0;
        }
        spectralAir = spectralAir / Math.max(1, Math.ceil(spectrum.length * 0.0475)) / 255;
        const onset = Math.max(0, power - priorPower.current);
        priorPower.current = power;
        const beat = Math.max(beatImpact.get(), downbeatImpact.get());
        envelope.current = Math.max(envelope.current * Math.exp(-dt * 4.2), Math.min(1, onset * 3.4 + beat));
        const t = clock.elapsedTime;
        const push = lite ? 0 : bass * 0.36 + envelope.current * 0.48 + spectralAir * 0.16;
        camera.position.x += ((lite ? 0 : Math.sin(t * 0.11) * 0.12) - camera.position.x) * Math.min(1, dt * 0.45);
        camera.position.y += ((lite ? 0 : Math.sin(t * 0.17) * 0.08) - camera.position.y) * Math.min(1, dt * 0.35);
        camera.position.z += ((8 - push) - camera.position.z) * Math.min(1, dt * (2.1 + envelope.current * 4));
        camera.lookAt(0, 0, -1.5);
    });
    return null;
};

interface ParticleProps extends AudioSceneProps {
    lite: boolean;
    accent: string;
}

export const CineParticles: React.FC<ParticleProps> = ({ audioBands, audioPower, lite, accent }) => {
    const points = useRef<THREE.Points>(null);
    const material = useRef<THREE.PointsMaterial>(null);
    const geometry = useMemo(() => {
        const count = lite ? 170 : 1150;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count);
        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2.4 + Math.random() * 8;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = -Math.random() * 18;
            randoms[i] = Math.random();
        }
        const next = new THREE.BufferGeometry();
        next.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        next.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
        return next;
    }, [lite]);

    useFrame((state, delta) => {
        if (!points.current || !material.current) return;
        const dt = Math.min(delta, 0.05);
        const bass = audioBands.bass.get() / 255;
        const treble = audioBands.treble.get() / 255;
        const power = audioPower.get() / 255;
        const spectrum = audioBands.spectrum?.get() ?? new Uint8Array(0);
        let spectralAir = 0;
        for (let i = Math.floor(spectrum.length * 0.62); i < spectrum.length; i += 4) {
            spectralAir += spectrum[i] || 0;
        }
        spectralAir = spectralAir / Math.max(1, Math.ceil(spectrum.length * 0.095)) / 255;
        const beat = Math.max(beatImpact.get(), downbeatImpact.get());
        points.current.rotation.y += dt * (0.012 + bass * 0.065);
        points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * (lite ? 0.015 : 0.06);
        material.current.size = (lite ? 0.035 : 0.045) + power * (lite ? 0.025 : 0.075) + beat * 0.035;
        material.current.opacity = 0.24 + Math.min(0.55, Math.max(treble, spectralAir) * 0.7);
    });

    return (
        <points ref={points} geometry={geometry} frustumCulled={false}>
            <pointsMaterial
                ref={material}
                color={accent}
                size={lite ? 0.045 : 0.055}
                sizeAttenuation
                transparent
                opacity={0.42}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

interface LyricsProps {
    lines: Line[];
    currentLineIndex: number;
}

export const CinematicLyrics: React.FC<LyricsProps> = ({ lines, currentLineIndex }) => {
    const visible = useMemo(() => {
        if (currentLineIndex < 0 || !lines.length) return [];
        return lines.slice(Math.max(0, currentLineIndex - 1), Math.min(lines.length, currentLineIndex + 3));
    }, [currentLineIndex, lines]);

    return (
        <Html transform position={[0, 0.05, -2.5]} distanceFactor={5.8} zIndexRange={[6, 2]}>
            <div className="cine-lyrics-world" aria-live="polite">
                {visible.map((line, index) => {
                    const actualIndex = Math.max(0, currentLineIndex - 1) + index;
                    const active = actualIndex === currentLineIndex;
                    return (
                        <div className={`cine-lyric${active ? ' is-active' : ''}`} key={`${actualIndex}-${line.fullText}`}>
                            {line.fullText}
                        </div>
                    );
                })}
            </div>
        </Html>
    );
};

interface ShelfProps {
    playlists: ProviderCollection[];
    onSelect?: (playlist: ProviderCollection) => void;
}

export const PlaylistShelf: React.FC<ShelfProps> = ({ playlists, onSelect }) => (
    <group position={[3.2, 0.05, -1.2]} rotation={[0, -0.3, 0]}>
        {playlists.map((playlist, index) => {
            const offset = index - Math.min(Math.floor(playlists.length / 2), 4);
            return (
                <Html
                    key={`${playlist.providerId}:${playlist.id}`}
                    transform
                    distanceFactor={7.8}
                    position={[offset * 0.04, -offset * 0.68, Math.abs(offset) * -0.32]}
                    rotation={[0, -offset * 0.06, 0]}
                    zIndexRange={[8, 1]}
                    occlude={false}
                >
                    <button
                        type="button"
                        className="cine-record"
                        onClick={() => onSelect?.(playlist)}
                        aria-label={`Open playlist ${playlist.name}`}
                    >
                        <span className="cine-record-art" style={{ backgroundImage: playlist.coverUrl ? `url("${playlist.coverUrl}")` : undefined }} />
                        <span className="cine-record-meta">
                            <small>{String(index + 1).padStart(2, '0')} / PLAYLIST</small>
                            <strong>{playlist.name}</strong>
                            <em>{playlist.creator?.nickname || `${playlist.trackCount || 0} tracks`}</em>
                        </span>
                        <span className="cine-record-play" aria-hidden="true">↗</span>
                    </button>
                </Html>
            );
        })}
    </group>
);
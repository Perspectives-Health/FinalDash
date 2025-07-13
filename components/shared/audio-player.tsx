"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, MoreHorizontal } from "lucide-react"

interface AudioPlayerProps {
  src: string
  className?: string
}

export default function AudioPlayer({ src, className = "" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
      setCurrentTime(audio.currentTime)
    }

    const setAudioTime = () => setCurrentTime(audio.currentTime)

    audio.addEventListener("loadeddata", setAudioData)
    audio.addEventListener("timeupdate", setAudioTime)

    return () => {
      audio.removeEventListener("loadeddata", setAudioData)
      audio.removeEventListener("timeupdate", setAudioTime)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const vol = parseFloat(e.target.value)
    audio.volume = vol
    setVolume(vol)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className={`bg-gray-100 rounded-full p-3 flex items-center space-x-3 ${className}`}>
      <audio ref={audioRef} src={src} />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-gray-700" />
        ) : (
          <Play className="w-5 h-5 text-gray-700 ml-0.5" />
        )}
      </button>

      {/* Time Display */}
      <div className="flex-shrink-0 text-sm font-medium text-gray-700 min-w-[80px]">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Progress Slider */}
      <div className="flex-1 relative">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #374151 0%, #374151 ${progressPercentage}%, #d1d5db ${progressPercentage}%, #d1d5db 100%)`
          }}
        />
      </div>

      {/* Volume Control */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
        >
          <Volume2 className="w-4 h-4 text-gray-700" />
        </button>
        
        {showVolumeSlider && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg p-2 w-24">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* More Options */}
      <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors">
        <MoreHorizontal className="w-4 h-4 text-gray-700" />
      </button>

    </div>
  )
}
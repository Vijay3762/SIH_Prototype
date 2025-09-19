'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box, Sphere, Text } from '@react-three/drei'
import { Mesh } from 'three'

interface MiniGamesProps {
  activeGame: 'fetch' | 'bubble' | 'recycle' | null
  onGameComplete: (score: number, coins: number) => void
  onClose: () => void
}

// Fetch Game Components
function Ball({ position, onCatch }: { position: [number, number, number], onCatch: () => void }) {
  const ballRef = useRef<Mesh>(null)
  const [isThrown, setIsThrown] = useState(false)

  useFrame(() => {
    if (ballRef.current && isThrown) {
      ballRef.current.position.z += 0.2
      ballRef.current.position.y -= 0.05
      
      if (ballRef.current.position.z > 8) {
        onCatch()
        setIsThrown(false)
      }
    }
  })

  return (
    <Sphere 
      ref={ballRef}
      args={[0.3]}
      position={position}
      onClick={() => setIsThrown(true)}
    >
      <meshStandardMaterial color="#EF4444" />
    </Sphere>
  )
}

export function FetchGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [ballPosition, setBallPosition] = useState<[number, number, number]>([0, 2, 0])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [score, onComplete])

  const handleCatch = () => {
    setScore(prev => prev + 10)
    setBallPosition([Math.random() * 4 - 2, 2, 0])
  }

  return (
    <group>
      <Text position={[0, 8, 0]} fontSize={1} color="#1F2937" anchorX="center">
        Fetch! Score: {score} Time: {timeLeft}s
      </Text>
      <Ball position={ballPosition} onCatch={handleCatch} />
      
      {/* Ground */}
      <Box args={[10, 0.2, 10]} position={[0, -1, 0]}>
        <meshStandardMaterial color="#22C55E" />
      </Box>
    </group>
  )
}

// Bubble Pop Game
function Bubble({ position, onPop, id }: { 
  position: [number, number, number]
  onPop: (id: number) => void
  id: number 
}) {
  const bubbleRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (bubbleRef.current) {
      bubbleRef.current.position.y += 0.02
      bubbleRef.current.rotation.x = state.clock.elapsedTime * 0.5
      bubbleRef.current.rotation.y = state.clock.elapsedTime * 0.3
      
      if (bubbleRef.current.position.y > 10) {
        onPop(id)
      }
    }
  })

  return (
    <Sphere 
      ref={bubbleRef}
      args={[0.5]}
      position={position}
      onClick={() => onPop(id)}
    >
      <meshStandardMaterial 
        color="#60A5FA" 
        transparent 
        opacity={0.7}
        roughness={0.1}
        metalness={0.1}
      />
    </Sphere>
  )
}

export function BubblePopGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [bubbles, setBubbles] = useState<Array<{ id: number, position: [number, number, number] }>>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    const spawnBubble = () => {
      const newBubble = {
        id: Date.now(),
        position: [Math.random() * 8 - 4, -2, Math.random() * 8 - 4] as [number, number, number]
      }
      setBubbles(prev => [...prev, newBubble])
    }

    const spawnInterval = setInterval(spawnBubble, 800)
    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(spawnInterval)
      clearInterval(gameTimer)
    }
  }, [score, onComplete])

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id))
    setCombo(prev => prev + 1)
    setScore(prev => prev + (10 * Math.max(1, combo)))
  }

  return (
    <group>
      <Text position={[0, 8, 0]} fontSize={1} color="#1F2937" anchorX="center">
        Pop Bubbles! Score: {score} Combo: {combo}x Time: {timeLeft}s
      </Text>
      
      {bubbles.map(bubble => (
        <Bubble 
          key={bubble.id}
          id={bubble.id}
          position={bubble.position}
          onPop={popBubble}
        />
      ))}
    </group>
  )
}

// Recycle Sort Game
function FallingItem({ 
  position, 
  type, 
  onCatch,
  id 
}: { 
  position: [number, number, number]
  type: 'plastic' | 'paper' | 'glass'
  onCatch: (id: number, type: string, position: [number, number, number]) => void
  id: number 
}) {
  const itemRef = useRef<Mesh>(null)
  
  useFrame(() => {
    if (itemRef.current) {
      itemRef.current.position.y -= 0.08
      itemRef.current.rotation.x += 0.1
      
      if (itemRef.current.position.y < -3) {
        onCatch(id, type, [itemRef.current.position.x, itemRef.current.position.y, itemRef.current.position.z])
      }
    }
  })

  const getColor = () => {
    switch (type) {
      case 'plastic': return '#EF4444'
      case 'paper': return '#EAB308' 
      case 'glass': return '#22C55E'
    }
  }

  return (
    <Box
      ref={itemRef}
      args={[0.5, 0.5, 0.5]}
      position={position}
      onClick={() => onCatch(id, type, position)}
    >
      <meshStandardMaterial color={getColor()} />
    </Box>
  )
}

function RecycleBin({ position, type, onItemDrop }: {
  position: [number, number, number]
  type: 'plastic' | 'paper' | 'glass'
  onItemDrop: (type: string) => void
}) {
  const getColor = () => {
    switch (type) {
      case 'plastic': return '#EF4444'
      case 'paper': return '#EAB308'
      case 'glass': return '#22C55E'
    }
  }

  return (
    <group position={position}>
      <Box args={[1.5, 2, 1.5]} onClick={() => onItemDrop(type)}>
        <meshStandardMaterial color={getColor()} />
      </Box>
      <Text 
        position={[0, 2.5, 0]} 
        fontSize={0.5} 
        color="#FFFFFF" 
        anchorX="center"
      >
        {type.toUpperCase()}
      </Text>
    </group>
  )
}

export function RecycleSortGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [items, setItems] = useState<Array<{ 
    id: number
    position: [number, number, number]
    type: 'plastic' | 'paper' | 'glass' 
  }>>([])
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    const spawnItem = () => {
      const types: ('plastic' | 'paper' | 'glass')[] = ['plastic', 'paper', 'glass']
      const newItem = {
        id: Date.now(),
        position: [Math.random() * 6 - 3, 8, 0] as [number, number, number],
        type: types[Math.floor(Math.random() * types.length)]
      }
      setItems(prev => [...prev, newItem])
    }

    const spawnInterval = setInterval(spawnItem, 1500)
    const gameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 || mistakes >= 3) {
          onComplete(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(spawnInterval)
      clearInterval(gameTimer)
    }
  }, [score, mistakes, onComplete])

  const catchItem = (id: number, type: string, position: [number, number, number]) => {
    setItems(prev => prev.filter(i => i.id !== id))
    
    // Check if item hit the ground (missed)
    if (position[1] < -2) {
      setMistakes(prev => prev + 1)
    }
  }

  const dropInBin = (binType: string) => {
    // Find nearest item and check if it matches
    const nearestItem = items.find(item => Math.abs(item.position[0]) < 2)
    if (nearestItem) {
      setItems(prev => prev.filter(i => i.id !== nearestItem.id))
      if (nearestItem.type === binType) {
        setScore(prev => prev + 20)
      } else {
        setMistakes(prev => prev + 1)
      }
    }
  }

  return (
    <group>
      <Text position={[0, 9, 0]} fontSize={0.8} color="#1F2937" anchorX="center">
        Recycle Sort! Score: {score} Mistakes: {mistakes}/3 Time: {timeLeft}s
      </Text>
      
      {items.map(item => (
        <FallingItem
          key={item.id}
          id={item.id}
          position={item.position}
          type={item.type}
          onCatch={catchItem}
        />
      ))}
      
      <RecycleBin position={[-3, 0, 0]} type="plastic" onItemDrop={dropInBin} />
      <RecycleBin position={[0, 0, 0]} type="paper" onItemDrop={dropInBin} />
      <RecycleBin position={[3, 0, 0]} type="glass" onItemDrop={dropInBin} />
    </group>
  )
}

export default function MiniGames({ activeGame, onGameComplete, onClose }: MiniGamesProps) {
  const handleGameComplete = (score: number) => {
    const coins = Math.floor(score / 10)
    onGameComplete(score, coins)
  }

  const renderGame = () => {
    switch (activeGame) {
      case 'fetch':
        return <FetchGame onComplete={handleGameComplete} />
      case 'bubble':
        return <BubblePopGame onComplete={handleGameComplete} />
      case 'recycle':
        return <RecycleSortGame onComplete={handleGameComplete} />
      default:
        return null
    }
  }

  if (!activeGame) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-4xl max-h-3xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          ✕ Close
        </button>
        
        <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />
          
          {renderGame()}
        </Canvas>
      </div>
    </div>
  )
}

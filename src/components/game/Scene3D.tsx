'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Pet, User } from '@/types'

interface Scene3DProps {
  pet: Pet
  user: User
  onPetInteraction: (type: 'feed' | 'play' | 'pet') => void
  showMiniGame?: 'fetch' | 'bubble' | 'recycle' | null
  onMiniGameComplete?: (score: number, coins: number) => void
}

export interface Scene3DRef {
  triggerAnimation: (animationName: string) => void
  playIdle: () => void
  playWalking: () => void
  playRunning: () => void
  playDance: () => void
  playJump: () => void
}

const Scene3D = forwardRef<Scene3DRef, Scene3DProps>(({ pet, user, onPetInteraction, showMiniGame, onMiniGameComplete }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const actionsRef = useRef<{ [key: string]: THREE.AnimationAction }>({})
  const activeActionRef = useRef<THREE.AnimationAction | null>(null)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentState, setCurrentState] = useState('Idle')
  const [availableStates, setAvailableStates] = useState<string[]>([])
  const [availableEmotes, setAvailableEmotes] = useState<string[]>([])
  
  // Mouse interaction states
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [mouseStartX, setMouseStartX] = useState(0)
  const [baseRotationY, setBaseRotationY] = useState(0)

  // Create procedural animations for models without built-in animations
  const createProceduralAnimations = (model: THREE.Group) => {
    console.log('Creating procedural animations for static model')
    
    const mixer = new THREE.AnimationMixer(model)
    mixerRef.current = mixer
    
    // Get the model's original position (rotation will be dynamic)
    const originalPosition = model.position.clone()
    
    // Idle Animation - gentle breathing/bobbing (position only)
    const idlePositionKF = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 1, 2],
      [
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x, originalPosition.y + 0.05, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z
      ]
    )
    const idleClip = new THREE.AnimationClip('Idle', 2, [idlePositionKF])
    
    // Walking Animation - small side to side movement (position only)
    const walkPositionKF = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 0.5, 1.0, 1.5, 2.0],
      [
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x + 0.2, originalPosition.y + 0.05, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x - 0.2, originalPosition.y + 0.05, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z
      ]
    )
    const walkClip = new THREE.AnimationClip('Walking', 2, [walkPositionKF])
    
    // Running Animation - faster movement with more bounce (position only)
    const runPositionKF = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 0.25, 0.5, 0.75, 1.0],
      [
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x + 0.3, originalPosition.y + 0.15, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x - 0.3, originalPosition.y + 0.15, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z
      ]
    )
    const runClip = new THREE.AnimationClip('Running', 1, [runPositionKF])
    
    // Dance Animation - up/down movement only (position only)
    const dancePositionKF = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 0.5, 1.0, 1.5, 2.0],
      [
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x, originalPosition.y + 0.2, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x, originalPosition.y + 0.2, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z
      ]
    )
    const danceClip = new THREE.AnimationClip('Dance', 2, [dancePositionKF])
    
    // Jump Animation - quick up and down (position only)
    const jumpPositionKF = new THREE.VectorKeyframeTrack(
      '.position',
      [0, 0.3, 0.6, 1.0],
      [
        originalPosition.x, originalPosition.y, originalPosition.z,
        originalPosition.x, originalPosition.y + 0.8, originalPosition.z,
        originalPosition.x, originalPosition.y + 0.8, originalPosition.z,
        originalPosition.x, originalPosition.y, originalPosition.z
      ]
    )
    const jumpClip = new THREE.AnimationClip('Jump', 1, [jumpPositionKF])
    
    // Create actions for each animation
    const actions: { [key: string]: THREE.AnimationAction } = {}
    
    // Looping animations
    actions['Idle'] = mixer.clipAction(idleClip)
    actions['Idle'].loop = THREE.LoopRepeat
    
    actions['Walking'] = mixer.clipAction(walkClip)
    actions['Walking'].loop = THREE.LoopRepeat
    
    actions['Running'] = mixer.clipAction(runClip)
    actions['Running'].loop = THREE.LoopRepeat
    
    actions['Dance'] = mixer.clipAction(danceClip)
    actions['Dance'].loop = THREE.LoopRepeat
    
    // One-time animations
    actions['Jump'] = mixer.clipAction(jumpClip)
    actions['Jump'].loop = THREE.LoopOnce
    actions['Jump'].clampWhenFinished = true
    
    actionsRef.current = actions
    
    // Start with idle animation
    activeActionRef.current = actions['Idle']
    activeActionRef.current.play()
    setCurrentState('Idle')
    
    console.log('Procedural animations created:', Object.keys(actions))
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js scene
    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    scene.fog = new THREE.Fog(0xf0f0f0, 20, 100)

    // Camera setup - positioned to fit within the container
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.25, 100)
    camera.position.set(-2, 1.5, 4)
    camera.lookAt(0, 1, 0)

    // Renderer setup - optimized for performance
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable for better performance
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap pixel ratio
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = false // Disable shadows for better performance
    container.appendChild(renderer.domElement)

    // Lighting - simplified for performance
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.8)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(0, 20, 10)
    scene.add(dirLight)

    // Ground
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0xe8f4f8, depthWrite: false })
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    scene.add(mesh)

    const grid = new THREE.GridHelper(20, 20, 0x000000, 0x000000)
    grid.material.opacity = 0.1
    grid.material.transparent = true
    scene.add(grid)

    // Store references
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Decide which model to load based on the logged-in user
    const pickModelForUser = (u: User) => {
      // Default penguin for student1; alternate model for student2
      // Fallback to penguin if anything is unknown
      const username = (u?.username || '').toLowerCase()
      const id = u?.id || ''

      // Known mappings in mock data
      if (id === 'user-001' || username.includes('ecoexplorer')) {
        return '/models/penguin+3d+model.glb'
      }
      if (id === 'user-002' || username.includes('natureguard')) {
        return '/models/cute+forest+creature+3d+model.glb'
      }

      // If another student logs in, prefer the new cute forest creature as variety
      return '/models/cute+forest+creature+3d+model.glb'
    }

    const modelUrl = pickModelForUser(user)

    // Load the selected model
    const loader = new GLTFLoader()
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene
        // Scale heuristics by file name so both models feel similar in scene
        const scale = modelUrl.includes('penguin') ? 1.5 : 1.6
        model.scale.setScalar(scale)
        model.position.set(0, 0, 0)
        
        // Set initial rotation (no fixed angle, user can control)
        model.rotation.y = 0
        setBaseRotationY(0)
        
        model.castShadow = true
        model.receiveShadow = true
        
        // Enable shadows for all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        scene.add(model)
        modelRef.current = model

        // Setup animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          console.log('Available animations:', gltf.animations.map(clip => clip.name))
          
          const mixer = new THREE.AnimationMixer(model)
          mixerRef.current = mixer
          
          const actions: { [key: string]: THREE.AnimationAction } = {}
          const states: string[] = []
          const emotes: string[] = []
          
          gltf.animations.forEach((clip) => {
            console.log(`Setting up animation: ${clip.name}`)
            const action = mixer.clipAction(clip)
            actions[clip.name] = action
            
            // Check if it's an emote (one-time animation)
            const emoteNames = ['jump', 'wave', 'dance', 'yes', 'no', 'punch', 'thumbsup']
            const isEmote = emoteNames.some(emote => clip.name.toLowerCase().includes(emote))
            
            if (isEmote) {
              emotes.push(clip.name)
              action.clampWhenFinished = true
              action.loop = THREE.LoopOnce
            } else {
              states.push(clip.name)
              action.loop = THREE.LoopRepeat
            }
          })
          
          actionsRef.current = actions
          setAvailableStates(states.length > 0 ? states : [])
          setAvailableEmotes(emotes)
          
          console.log('States:', states)
          console.log('Emotes:', emotes)
          
          // Start with first available animation
          if (states.length > 0) {
            const initialState = states[0]
            activeActionRef.current = actions[initialState]
            activeActionRef.current.play()
            setCurrentState(initialState)
            console.log(`Started initial animation: ${initialState}`)
          }
        } else {
          console.log('No animations found in the model - creating procedural animations')
          // Create procedural animations since the model has no built-in animations
          createProceduralAnimations(model)
          setAvailableStates(['Idle', 'Walking', 'Running', 'Dance'])
          setAvailableEmotes(['Jump'])
        }
        
        setIsLoaded(true)
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
      },
      (error) => {
        console.error('Error loading model:', error)
        // Fallback to penguin if alternate model fails to load
        if (!modelUrl.includes('penguin')) {
          loader.load(
            '/models/penguin+3d+model.glb',
            (fallbackGltf) => {
              const model = fallbackGltf.scene
              model.scale.setScalar(1.5)
              model.position.set(0, 0, 0)
              model.rotation.y = 0
              setBaseRotationY(0)
              model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true
                  child.receiveShadow = true
                }
              })
              scene.add(model)
              modelRef.current = model
              if (fallbackGltf.animations && fallbackGltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model)
                mixerRef.current = mixer
                const actions: { [key: string]: THREE.AnimationAction } = {}
                const states: string[] = []
                const emotes: string[] = []
                fallbackGltf.animations.forEach((clip) => {
                  const action = mixer.clipAction(clip)
                  actions[clip.name] = action
                  const emoteNames = ['jump', 'wave', 'dance', 'yes', 'no', 'punch', 'thumbsup']
                  const isEmote = emoteNames.some(emote => clip.name.toLowerCase().includes(emote))
                  if (isEmote) {
                    emotes.push(clip.name)
                    action.clampWhenFinished = true
                    action.loop = THREE.LoopOnce
                  } else {
                    states.push(clip.name)
                    action.loop = THREE.LoopRepeat
                  }
                })
                actionsRef.current = actions
                setAvailableStates(states.length > 0 ? states : [])
                setAvailableEmotes(emotes)
                if (states.length > 0) {
                  const initialState = states[0]
                  activeActionRef.current = actions[initialState]
                  activeActionRef.current.play()
                  setCurrentState(initialState)
                }
              } else {
                createProceduralAnimations(model)
                setAvailableStates(['Idle', 'Walking', 'Running', 'Dance'])
                setAvailableEmotes(['Jump'])
              }
              setIsLoaded(true)
            },
            undefined,
            () => setIsLoaded(true)
          )
        } else {
          setIsLoaded(true) // Show UI even if fallback also fails
        }
      }
    )

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      const delta = clockRef.current.getDelta()
      if (mixerRef.current) {
        mixerRef.current.update(delta)
      }
      
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  const fadeToAction = (name: string, duration: number = 0.5) => {
    if (!actionsRef.current[name]) return
    
    const previousAction = activeActionRef.current
    const activeAction = actionsRef.current[name]
    
    if (previousAction !== activeAction) {
      if (previousAction) {
        previousAction.fadeOut(duration)
      }
    }
    
    activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play()
    
    activeActionRef.current = activeAction
    setCurrentState(name)
  }

  const handleStateChange = (state: string) => {
    fadeToAction(state, 0.5)
  }

  const handleEmote = (emote: string) => {
    fadeToAction(emote, 0.2)
    
    // Return to previous state after emote finishes
    if (mixerRef.current) {
      const restoreState = () => {
        mixerRef.current?.removeEventListener('finished', restoreState)
        fadeToAction(currentState, 0.2)
      }
      mixerRef.current.addEventListener('finished', restoreState)
    }
  }

  // Mouse event handlers for rotation
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsMouseDown(true)
    setMouseStartX(event.clientX)
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isMouseDown || !modelRef.current) return
    
    const deltaX = event.clientX - mouseStartX
    const rotationSpeed = 0.01
    const newRotationY = baseRotationY + (deltaX * rotationSpeed)
    
    modelRef.current.rotation.y = newRotationY
  }

  const handleMouseUp = (event: React.MouseEvent) => {
    if (!isMouseDown) return
    
    const deltaX = Math.abs(event.clientX - mouseStartX)
    
    // If mouse didn't move much, treat it as a click (jump)
    if (deltaX < 5) {
      handlePetClick()
    } else {
      // Update base rotation for next drag
      if (modelRef.current) {
        setBaseRotationY(modelRef.current.rotation.y)
      }
    }
    
    setIsMouseDown(false)
  }

  const handleMouseLeave = () => {
    if (isMouseDown && modelRef.current) {
      setBaseRotationY(modelRef.current.rotation.y)
    }
    setIsMouseDown(false)
  }

  const handlePetClick = () => {
    onPetInteraction('pet')
    // Trigger a random emote if available
    if (availableEmotes.length > 0) {
      const randomEmote = availableEmotes[Math.floor(Math.random() * availableEmotes.length)]
      handleEmote(randomEmote)
    }
  }

  // Expose animation functions to parent component
  useImperativeHandle(ref, () => ({
    triggerAnimation: (animationName: string) => {
      console.log(`Trying to trigger animation: ${animationName}`)
      
      // Try exact match first
      if (actionsRef.current[animationName]) {
        fadeToAction(animationName, 0.5)
        return
      }
      
      // Try case-insensitive match
      const availableNames = Object.keys(actionsRef.current)
      const match = availableNames.find(name => 
        name.toLowerCase() === animationName.toLowerCase()
      )
      
      if (match) {
        fadeToAction(match, 0.5)
      } else {
        console.warn(`Animation "${animationName}" not found. Available:`, availableNames)
      }
    },
    playIdle: () => {
      const idleNames = ['Idle', 'idle', 'IDLE', 'T-Pose', 'TPose', 'Rest']
      const availableNames = Object.keys(actionsRef.current)
      const idleAnimation = idleNames.find(name => availableNames.includes(name)) || availableNames[0]
      
      if (idleAnimation) {
        console.log(`Playing idle animation: ${idleAnimation}`)
        fadeToAction(idleAnimation, 0.5)
      }
    },
    playWalking: () => {
      const walkNames = ['Walking', 'Walk', 'walking', 'walk', 'WALK']
      const availableNames = Object.keys(actionsRef.current)
      const walkAnimation = walkNames.find(name => availableNames.includes(name))
      
      if (walkAnimation) {
        console.log(`Playing walk animation: ${walkAnimation}`)
        fadeToAction(walkAnimation, 0.5)
      } else {
        console.warn('No walking animation found. Available:', availableNames)
      }
    },
    playRunning: () => {
      const runNames = ['Running', 'Run', 'running', 'run', 'RUN']
      const availableNames = Object.keys(actionsRef.current)
      const runAnimation = runNames.find(name => availableNames.includes(name))
      
      if (runAnimation) {
        console.log(`Playing run animation: ${runAnimation}`)
        fadeToAction(runAnimation, 0.5)
      } else {
        console.warn('No running animation found. Available:', availableNames)
      }
    },
    playDance: () => {
      const danceNames = ['Dance', 'dance', 'DANCE', 'Dancing']
      const availableNames = Object.keys(actionsRef.current)
      const danceAnimation = danceNames.find(name => availableNames.includes(name))
      
      if (danceAnimation) {
        console.log(`Playing dance animation: ${danceAnimation}`)
        if (availableEmotes.includes(danceAnimation)) {
          handleEmote(danceAnimation)
        } else {
          fadeToAction(danceAnimation, 0.5)
        }
      } else {
        console.warn('No dance animation found. Available:', availableNames)
      }
    },
    playJump: () => {
      const jumpNames = ['Jump', 'jump', 'JUMP', 'Jumping']
      const availableNames = Object.keys(actionsRef.current)
      const jumpAnimation = jumpNames.find(name => availableNames.includes(name))
      
      if (jumpAnimation) {
        console.log(`Playing jump animation: ${jumpAnimation}`)
        handleEmote(jumpAnimation)
      } else {
        console.warn('No jump animation found. Available:', availableNames)
      }
    }
  }))

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-sky-100 to-green-100 rounded-lg overflow-hidden">
      {/* 3D Scene Container - Full height */}
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isMouseDown ? 'grabbing' : 'grab' }}
      />
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
            <p className="text-gray-600 font-mono">Loading {pet.name}...</p>
          </div>
        </div>
      )}
    </div>
  )
})

Scene3D.displayName = 'Scene3D'

export default Scene3D

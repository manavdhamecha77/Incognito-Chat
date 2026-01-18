import { nanoid } from "nanoid"
import { useEffect, useState } from "react"

const NAMES = ["thor","hulk","sentry","spidy","captian","bucky","stark","groot","rocket","fantastic","cyclops"]
const STORAGE_KEY = "chat_username"

const generateUsername = () => {
  const word = NAMES[Math.floor(Math.random() * NAMES.length)]
  return `anonymous-${word}-${nanoid(5)}`
}

export const useUsername = () => {
    const [username,setUsername] = useState("")

    useEffect(() => {
    const main = () => {
      const stored = localStorage.getItem(STORAGE_KEY)

      if(stored) {
        setUsername(stored)
        return 
      }

      const generated = generateUsername()
      localStorage.setItem(STORAGE_KEY, generated)
      setUsername(generated)
    }
    main()
  }, [])

  return { username }
}

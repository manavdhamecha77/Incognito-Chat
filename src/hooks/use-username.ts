import { nanoid } from "nanoid"
import { useEffect, useState } from "react"

const POKEMON = ["pikachu","squirtle","charmander","bulbasaur","psyduck","gastly","geodude","mew","gengar","togepie","digglet","pichu","ditto","caterpie","evee"]
const STORAGE_KEY = "chat_username"

const generateUsername = () => {
  const word = POKEMON[Math.floor(Math.random() * POKEMON.length)]
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

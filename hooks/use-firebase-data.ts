"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, onSnapshot, type DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useFirebaseData(collectionName: string) {
  const [data, setData] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!collectionName) return

    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const entries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setData(entries)
        setLoading(false)
        setError(null)
        setIsInitialized(true)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
        setIsInitialized(true)
      },
    )

    return () => unsubscribe()
  }, [collectionName])

  const refetch = async () => {
    if (!collectionName) return

    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, collectionName))
      const entries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setData(entries)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Return null data until the component is mounted on the client
  if (!isInitialized) {
    return { data: [], loading: true, error: null, refetch }
  }

  return { data, loading, error, refetch }
}

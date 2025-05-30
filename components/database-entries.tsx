"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Database, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useFirebaseData } from "@/hooks/use-firebase-data"
import { useAuth } from "@/contexts/auth-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { DocumentData } from "firebase/firestore"

export function DatabaseEntries() {
  const [collectionName, setCollectionName] = useState("consultations")
  const { data, loading, error, refetch } = useFirebaseData(collectionName)
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<DocumentData | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "null"
    if (value instanceof Date) {
      return value.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
      })
    }
    if (typeof value === "object") {
      // Handle Firestore Timestamp
      if (value.seconds && value.nanoseconds) {
        const date = new Date(value.seconds * 1000)
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZoneName: 'short'
        })
      }
      return JSON.stringify(value, null, 2)
    }
    if (typeof value === "boolean") return value.toString()
    return String(value)
  }

  const handleDelete = async (entry: DocumentData) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!entryToDelete?.id) return

    try {
      await deleteDoc(doc(db, collectionName, entryToDelete.id))
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
      refetch() // Refresh the data after deletion
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const handleStatusChange = async (entry: DocumentData, newStatus: string) => {
    try {
      await updateDoc(doc(db, collectionName, entry.id), {
        status: newStatus
      })
      refetch() // Refresh the data after update
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  // Define the desired exact order of fields
  const desiredOrder = ["name", "message", "createdAt", "address", "phone", "email"]

  // Only render the main content on the client side
  if (!isMounted || !user) {
    return null
  }

  // Filter data to only include fields in desiredOrder and necessary fields for actions, maintaining order
  const orderedData = data.map(entry => {
    const orderedEntry: any = {};
    desiredOrder.forEach(field => {
      if (entry[field] !== undefined) {
        orderedEntry[field] = entry[field];
      }
    });
    // Include status and id specifically for actions
    orderedEntry.id = entry.id;
    if (entry.status !== undefined) {
        orderedEntry.status = entry.status;
    }
    return orderedEntry;
  });

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error fetching data: {error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading entries...</span>
            </div>
          )}

          {!loading && !error && ( orderedData.length > 0 ? (
            <div className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {desiredOrder.map((field) => (
                          <TableHead key={field} className="py-1">
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                          </TableHead>
                        ))}
                        <TableHead className="py-1">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderedData.map((entry) => (
                        <TableRow key={entry.id}>
                          {desiredOrder.map((field) => (
                            <TableCell key={field} className="py-1">
                              {formatValue(entry[field])}
                            </TableCell>
                          ))}
                          <TableCell className="py-1">
                            <div className="flex items-center gap-2">
                               {/* Status dropdown */}
                              <Select
                                value={entry.status}
                                onValueChange={(value) => handleStatusChange(entry, value)}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="reviewed">Reviewed</SelectItem>
                                </SelectContent>
                              </Select>
                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entry)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>

            </div>
           ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No entries found in the "{collectionName}" collection.
                  </CardContent>
                </Card>
           )
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entry from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

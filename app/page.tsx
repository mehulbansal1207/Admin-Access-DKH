import { NavBar } from "@/components/nav-bar"
import { ProtectedRoute } from "@/components/protected-route"
import { DatabaseEntries } from "@/components/database-entries"

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <div className="container mx-auto py-8 px-4 flex-1">
          <div className="">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight mb-2">Dhiman Kitchen House</h1>
            </div>
            <DatabaseEntries />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

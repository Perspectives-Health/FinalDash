"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/services/api"
import { Edit, Save, Loader2 } from "lucide-react"

export default function VersionUpdate() {
  const [currentVersion, setCurrentVersion] = useState<string>("")
  const [newVersion, setNewVersion] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Load current version on component mount
  useEffect(() => {
    loadCurrentVersion()
  }, [])

  const loadCurrentVersion = async () => {
    setIsLoading(true)
    try {
      const response = await api.getLatestExtensionVersion()
      setCurrentVersion(response.latest_version)
      setNewVersion(incrementVersion(response.latest_version))
    } catch (error) {
      console.error("Failed to load current version:", error)
      toast({
        title: "Error",
        description: "Failed to load current extension version",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const incrementVersion = (version: string): string => {
    const parts = version.split('.')
    if (parts.length >= 3) {
      const patch = parseInt(parts[2]) + 1
      return `${parts[0]}.${parts[1]}.${patch}`
    }
    return version
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setNewVersion(incrementVersion(currentVersion))
  }

  const handleSaveClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmUpdate = async () => {
    setIsUpdating(true)
    try {
      await api.updateAllUsersExtensionVersion(newVersion)
      setCurrentVersion(newVersion)
      setIsEditing(false)
      setShowConfirmDialog(false)
      toast({
        title: "Success",
        description: `Extension version updated to ${newVersion}`,
      })
    } catch (error) {
      console.error("Failed to update extension version:", error)
      toast({
        title: "Error",
        description: "Failed to update extension version",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNewVersion(incrementVersion(currentVersion))
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading version...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Extension Version:</span>
      
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <Input
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            className="w-24 h-8 text-sm"
            placeholder="1.0.0"
          />
          <Button
            size="sm"
            onClick={handleSaveClick}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{currentVersion}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEditClick}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg !bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Extension Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the extension version from <strong>{currentVersion}</strong> to <strong>{newVersion}</strong>?
              <br /><br />
              This will mark all users as requiring an update to the new version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmUpdate}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Version"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

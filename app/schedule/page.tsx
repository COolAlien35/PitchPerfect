"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Brain,
  Zap,
  Target,
  Flame,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Bell,
  MapPin,
  Video,
  Mic
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface ScheduledSession {
  id: string
  title: string
  type: string
  date: string
  time: string
  duration: number
  description?: string
  location: string
  participants?: number
  reminder: boolean
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: string
}

const sessionTypes = [
  { value: 'behavioral', label: 'Behavioral Interview', icon: Users, color: 'bg-blue-500' },
  { value: 'technical', label: 'Technical Interview', icon: Brain, color: 'bg-green-500' },
  { value: 'pressure', label: 'Pressure Mode', icon: Zap, color: 'bg-orange-500' },
  { value: 'custom', label: 'Custom Session', icon: Target, color: 'bg-purple-500' },
  { value: 'group', label: 'Group Discussion', icon: Users, color: 'bg-pink-500' },
  { value: 'challenge', label: 'Extreme Challenge', icon: Flame, color: 'bg-red-500' }
]

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
]

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
]

export default function SchedulePage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)

  const [newSession, setNewSession] = useState({
    title: '',
    type: '',
    date: '',
    time: '',
    duration: 30,
    description: '',
    location: 'online',
    participants: 1,
    reminder: true
  })

  const handleCreateSession = async () => {
    if (!user || !selectedDate) return

    try {
      const sessionData: ScheduledSession = {
        id: crypto.randomUUID(),
        ...newSession,
        date: selectedDate.toISOString().split('T')[0],
        status: 'scheduled' as const,
        createdAt: new Date().toISOString()
      }

      // TODO: Save to backend when schedule endpoint is available
      console.log('Creating session (will be sent to backend):', sessionData)

      setScheduledSessions(prev => [...prev, sessionData])

      // Reset form
      setNewSession({
        title: '',
        type: '',
        date: '',
        time: '',
        duration: 30,
        description: '',
        location: 'online',
        participants: 1,
        reminder: true
      })
      setSelectedDate(undefined)
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating session:', error)
      alert(`Failed to schedule session: ${error instanceof Error ? error.message : 'Unknown error'}.`)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    // TODO: Delete from backend when schedule endpoint is available
    setScheduledSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const getSessionTypeInfo = (type: string) => {
    return sessionTypes.find(s => s.value === type) || sessionTypes[0]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getUpcomingSessions = () => {
    const today = new Date().toISOString().split('T')[0]
    return scheduledSessions.filter(session =>
      session.date >= today && session.status === 'scheduled'
    ).slice(0, 3)
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-primary-text">
              Schedule Session
            </span>
          </div>

          <Button
            onClick={() => setIsCreating(true)}
            className="btn-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Schedule New Session */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Scheduled</p>
                      <p className="text-2xl font-bold text-foreground">{scheduledSessions.length}</p>
                    </div>
                    <CalendarIcon className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                      <p className="text-2xl font-bold text-foreground">{getUpcomingSessions().length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-foreground">
                        {scheduledSessions.filter(s => s.status === 'completed').length}
                      </p>
                    </div>
                    <Check className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Create New Session Form */}
            {isCreating && (
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Plus className="mr-3 h-6 w-6 text-primary" />
                    Schedule New Session
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Plan your next practice session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-foreground font-medium">Session Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Technical Interview Practice"
                        value={newSession.title}
                        onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                        className="bg-background/50 border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-foreground font-medium">Session Type *</Label>
                      <Select
                        value={newSession.type}
                        onValueChange={(value) => setNewSession({ ...newSession, type: value })}
                      >
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue placeholder="Select session type" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background/50 border-border",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-foreground font-medium">Time *</Label>
                      <Select
                        value={newSession.time}
                        onValueChange={(value) => setNewSession({ ...newSession, time: value })}
                      >
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-foreground font-medium">Duration</Label>
                      <Select
                        value={newSession.duration.toString()}
                        onValueChange={(value) => setNewSession({ ...newSession, duration: parseInt(value) })}
                      >
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about what you want to practice..."
                      value={newSession.description}
                      onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                      className="bg-background/50 border-border"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                      className="bg-background/50 border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSession}
                      disabled={!newSession.title || !newSession.type || !selectedDate || !newSession.time}
                      className="btn-gradient-primary"
                    >
                      Schedule Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scheduled Sessions List */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Your Scheduled Sessions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your practice sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">No sessions scheduled yet</p>
                    <p className="text-sm text-muted-foreground">Click "Schedule Session" to plan your first practice session</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledSessions.map((session) => {
                      const typeInfo = getSessionTypeInfo(session.type)
                      const IconComponent = typeInfo.icon

                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${typeInfo.color} text-white`}>
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{session.title}</h3>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {new Date(session.date).toLocaleDateString()} at {session.time}
                                <span className="mx-2">•</span>
                                <Clock className="w-3 h-3 mr-1" />
                                {session.duration} minutes
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(session.status)} text-white`}>
                              {session.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar & Quick Actions */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border-0"
                />
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {getUpcomingSessions().length === 0 ? (
                  <p className="text-muted-foreground text-sm">No upcoming sessions</p>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingSessions().map((session) => {
                      const typeInfo = getSessionTypeInfo(session.type)
                      const IconComponent = typeInfo.icon

                      return (
                        <div key={session.id} className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
                          <div className={`flex h-8 w-8 items-center justify-center rounded ${typeInfo.color} text-white`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.date).toLocaleDateString()} at {session.time}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push('/interview/behavioral')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

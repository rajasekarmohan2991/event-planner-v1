"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CreateEventPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    venue: "",
    max_attendees: "",
    event_type: "CONFERENCE"
  });
  const [daysDetails, setDaysDetails] = useState<any[]>([]);

  // Calculate days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);

      // Reset time to midnight for accurate day calculation
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      const diffTime = endDay.getTime() - startDay.getTime();
      const dayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      console.log('Date calculation:', {
        start_date: formData.start_date,
        end_date: formData.end_date,
        startDay,
        endDay,
        diffTime,
        dayCount,
        willShow: dayCount >= 1
      });

      if (dayCount >= 1) {
        setDaysDetails(prev => {
          // Preserve existing details if count matches, otherwise regenerate
          if (prev.length === dayCount) return prev;

          return Array.from({ length: dayCount }, (_, i) => {
            const date = new Date(startDay);
            date.setDate(date.getDate() + i);
            return {
              date: date.toISOString(),
              title: `Day ${i + 1}`,
              startTime: "09:00",
              endTime: "17:00"
            };
          });
        });
      } else {
        setDaysDetails([]);
      }
    }
  }, [formData.start_date, formData.end_date]);

  const updateDayDetail = (index: number, field: string, value: string) => {
    setDaysDetails(prev => {
      const newDetails = [...prev];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return newDetails;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!params?.id) {
        alert("Invalid company ID");
        return;
      }
      const res = await fetch(`/api/super-admin/companies/${params.id}/events`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          daysConfig: daysDetails.length > 0 ? daysDetails : undefined
        })
      });

      if (res.ok) {
        router.push(`/super-admin/companies/${params?.id}`);
      } else {
        alert("Failed to create event");
      }
    } catch (error) {
      alert("Error creating event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Event</h1>
        <p className="text-gray-600">Create a new event for this company</p>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Event description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event venue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attendees
              </label>
              <input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Maximum attendees"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CONFERENCE">Conference</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SEMINAR">Seminar</option>
                <option value="MEETUP">Meetup</option>
                <option value="WEBINAR">Webinar</option>
              </select>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
            <strong>Debug:</strong> daysDetails.length = {daysDetails.length}
            {daysDetails.length > 0 && (
              <div className="mt-1">Days: {daysDetails.map((d, i) => `Day ${i + 1}`).join(', ')}</div>
            )}
          </div>

          {/* Daily Configurations */}
          {daysDetails.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-gray-900">Event Schedule Configuration</h3>
              <div className="space-y-4">
                {daysDetails.map((day, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">Day {index + 1} - {new Date(day.date).toLocaleDateString()}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Day Title</label>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => updateDayDetail(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder={`e.g. Day ${index + 1}: Keynotes`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Time Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => updateDayDetail(index, 'startTime', e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => updateDayDetail(index, 'endTime', e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
          }

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

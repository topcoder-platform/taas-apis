from typing import List, Dict, Any, Optional
from copy import deepcopy


class CalendarService:
    def __init__(self):
        # Storage keyed by userId
        self._data: Dict[str, List[Dict[str, Any]]] = {}

    def _fetch_collection(self, user_id: str) -> List[Dict[str, Any]]:
        """Helper to get the list of calendars for a specific user."""
        return self._data.setdefault(user_id, [])

    def get_active(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Endpoint: GET /taas/user-meeting-settings/:userId
        Returns a filtered list excluding calendars marked as 'is_deleted'.
        """
        raw = self._fetch_collection(user_id)
        
        # Filter strictly for 'is_deleted' to handle None vs False edge cases
        return [cal for cal in raw if not cal.get('is_deleted')]

    def soft_delete(self, user_id: str, calendar_id: str) -> Dict[str, Any]:
        """
        Endpoint: DELETE /taas/user-meeting-settings/:userId/calendars/:calendarId
        Instead of removing the object, marks it with 'is_deleted: true'.
        """
        raw = self._fetch_collection(user_id)
        
        target = next((cal for cal in raw if cal.get('id') == calendar_id), None)
        
        if target:
            target['is_deleted'] = True
        return target

    def connect(self, user_id: str, calendar_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Endpoint: CONNECT (e.g., POST/PATCH to add a new calendar)
        Logic: If a calendar with the same ID exists (from a previous soft delete),
        update its details and mark it as 'not deleted'.
        """
        raw = self._fetch_collection(user_id)
        
        target = next((cal for cal in raw if cal.get('id') == calendar_data.get('id')), None)
        
        if target:
            # If the existing target was marked as deleted, toggle it back to false
            # (Handling the scenario where a re-connect implies the original source returned back)
            if target.get('is_deleted'):
                target['is_deleted'] = False
            
            # Merge the new incoming data into the existing target
            target.update(calendar_data)
        else:
            # If raw list was empty, append the new one
            raw.append(calendar_data)
            
            # Ensure new entries have the boolean state consistent
            if not calendar_data.get('is_deleted'):
                calendar_data['is_deleted'] = False
                
        return target
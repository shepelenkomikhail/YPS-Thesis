const API_URL = "http://localhost:8000";

export const friendService = {
    searchFriends: async (username: string) => {
        const response = await fetch(`${API_URL}/friends/search?username=${username}`, {
            credentials: 'include'
        });
        return response.json();
    },

    sendFriendRequest: async (receiverId: string) => {
        console.log("RECEIVERID", receiverId);
        const response = await fetch(`${API_URL}/friends/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId }),
            credentials: 'include'
        });
        return response.json();
    },

    getFriendRequests: async () => {
        const response = await fetch(`${API_URL}/friends/requests`, {
            credentials: 'include'
        });
        return response.json();
    },

    respondToRequest: async (requestId: string, status: 'accepted' | 'rejected') => {
        console.log("Sending friend request response. ID:", requestId, "Status:", status);
        const response = await fetch(`${API_URL}/friends/requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });
        return response.json();
    },

    getFriends: async () => {
        const response = await fetch(`${API_URL}/friends`, {
            credentials: 'include'
        });
        return response.json();
    },

    removeFriend: async (friendId: string) => {
        const response = await fetch(`${API_URL}/friends/${friendId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return response.json();
    },

    fetchStatuses: async () => {
        try {
            const response = await fetch(`${API_URL}/friends/statuses`, {
                credentials: 'include'
            });
            return  response.json();

        } catch (error) {
            console.error('Error fetching friend statuses:', error);
        }

    }
};
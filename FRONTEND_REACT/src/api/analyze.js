export async function analyzeGraph(payload) {
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
            return data.result;
        } else {
            throw new Error(data.error || 'Unknown error from server');
        }
    } catch (error) {
        console.error('Analysis failed:', error);
        return { success: false, error: error.message };
    }
}

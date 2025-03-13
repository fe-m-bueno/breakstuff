export async function fetchAI(task: string, parentContext?: string) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, parentContext }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    return [
      data.response.firstTask,
      data.response.secondTask,
      data.response.thirdTask,
      data.response.fourthTask,
      data.response.fifthTask,
    ];
  } catch (error) {
    console.error('Error fetching AI', error);
    return [];
  }
}

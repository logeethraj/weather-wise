export async function POST(request) {
  try {
    const { question, weatherContext } = await request.json();

    if (!question || !question.trim()) {
      return Response.json({ error: 'Question is required.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'AI service is not configured.' },
        { status: 500 }
      );
    }

    const prompt = `You are a helpful weather assistant. Answer the user's question using ONLY the weather data provided below. Be concise (2-3 sentences max), practical, and friendly.

Current weather data:
${JSON.stringify(weatherContext, null, 2)}

User question: ${question}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      return Response.json(
        { error: 'AI service request failed.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return Response.json({ answer });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Something went wrong processing your request.' },
      { status: 500 }
    );
  }
}
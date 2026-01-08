import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = process.env.GOOGLE_GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
    : null;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, type, description } = body;

        if (!title || !type) {
            return NextResponse.json({
                error: "Title and type are required"
            }, { status: 400 });
        }

        // Use real AI if API key is available, otherwise fallback to templates
        if (genAI && process.env.GOOGLE_GEMINI_API_KEY) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                const prompt = `You are an expert event marketing copywriter. Generate professional, engaging content for an event.

Event Details:
- Title: ${title}
- Type: ${type}
- Description: ${description || 'Not provided'}

Please generate:
1. A compelling 2-3 sentence overview that would attract attendees
2. Exactly 5 "Good to Know" bullet points (practical information attendees should know)

Format your response as JSON:
{
  "overview": "your overview text here",
  "goodToKnow": ["point 1", "point 2", "point 3", "point 4", "point 5"]
}

Make it professional, engaging, and specific to the event type. Focus on benefits and practical details.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Extract JSON from response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const aiContent = JSON.parse(jsonMatch[0]);
                    return NextResponse.json({
                        overview: aiContent.overview,
                        goodToKnow: aiContent.goodToKnow || [],
                        generated: true,
                        source: 'gemini-ai'
                    });
                }
            } catch (aiError) {
                console.error("Gemini AI error, falling back to templates:", aiError);
                // Fall through to template-based generation
            }
        }

        // Fallback to template-based generation
        const templateContent = generateTemplateContent(title, type, description);
        return NextResponse.json({
            ...templateContent,
            generated: true,
            source: 'template'
        });

    } catch (error) {
        console.error("AI content generation error:", error);
        return NextResponse.json({
            error: "Failed to generate content"
        }, { status: 500 });
    }
}

// Template-based fallback (existing logic)
function generateTemplateContent(title: string, type: string, description: string) {
    const templates: Record<string, { overview: string; goodToKnow: string[] }> = {
        'Conference': {
            overview: `Join us for ${title}, a premier professional gathering bringing together industry leaders, innovators, and professionals. This conference offers unparalleled networking opportunities, cutting-edge insights, and hands-on learning experiences designed to elevate your career and expand your professional network.`,
            goodToKnow: [
                'Networking sessions scheduled throughout the day',
                'Industry expert speakers and panel discussions',
                'Certificate of attendance provided',
                'Professional photography and event coverage',
                'Post-event networking opportunities'
            ]
        },
        'Workshop': {
            overview: `Experience hands-on learning at ${title}! This interactive workshop is designed to provide practical skills and actionable knowledge. Whether you're a beginner or looking to enhance your expertise, our expert facilitators will guide you through engaging exercises and real-world applications.`,
            goodToKnow: [
                'All materials and resources included',
                'Small group sizes for personalized attention',
                'Hands-on practical exercises',
                'Take-home resources and templates',
                'Certificate of completion awarded'
            ]
        },
        'Meetup': {
            overview: `Connect with like-minded individuals at ${title}! This community meetup is all about building meaningful relationships, sharing experiences, and learning from each other in a relaxed, welcoming environment.`,
            goodToKnow: [
                'Casual and welcoming atmosphere',
                'Great for networking and making friends',
                'Open to all skill levels',
                'Light refreshments provided',
                'Regular recurring events'
            ]
        },
        'Webinar': {
            overview: `Join ${title} from anywhere in the world! This virtual event brings expert knowledge directly to your screen. Participate in live Q&A sessions, access exclusive content, and connect with attendees globally.`,
            goodToKnow: [
                'Accessible from any device with internet',
                'Recording available for registered attendees',
                'Live Q&A with speakers',
                'Digital resources and slides provided',
                'Interactive polls and engagement features'
            ]
        },
        'Exhibition': {
            overview: `Discover innovation at ${title}! This exhibition showcases the latest products, services, and ideas from leading companies and creators. Explore interactive displays and meet industry pioneers.`,
            goodToKnow: [
                'Free entry for registered attendees',
                'Exclusive product demonstrations',
                'Meet exhibitors and industry leaders',
                'Special offers and giveaways',
                'Guided tours available'
            ]
        },
        'Concert': {
            overview: `Get ready for an unforgettable night at ${title}! Experience live music at its finest with incredible performances, amazing sound quality, and an electric atmosphere.`,
            goodToKnow: [
                'Premium sound and lighting setup',
                'Multiple viewing areas available',
                'Food and beverage vendors on-site',
                'Merchandise available for purchase',
                'Age restrictions may apply'
            ]
        },
        'Festival': {
            overview: `Celebrate at ${title}, a vibrant festival bringing together music, art, food, and culture! Immerse yourself in a multi-sensory experience with diverse performances and interactive installations.`,
            goodToKnow: [
                'Multiple stages and activity zones',
                'Food trucks and artisan vendors',
                'Family-friendly activities available',
                'Camping and accommodation options',
                'Rain or shine event'
            ]
        },
        'Other': {
            overview: `${title} is a unique event designed to bring people together for an exceptional experience. With carefully curated content and engaging activities, this event offers something special for everyone.`,
            goodToKnow: [
                'Detailed agenda shared closer to event date',
                'Limited seats available',
                'Early bird discounts for early registrations',
                'Accessible venue with parking',
                'Contact organizers for special requirements'
            ]
        }
    };

    const template = templates[type] || templates['Other'];
    let overview = template.overview;
    let goodToKnow = [...template.goodToKnow];

    // Enhance based on description keywords
    if (description) {
        const descLower = description.toLowerCase();

        if (descLower.includes('beginner') || descLower.includes('new')) {
            overview += ' This event is particularly welcoming to beginners and newcomers.';
        }

        if (descLower.includes('advanced') || descLower.includes('expert')) {
            overview += ' Designed for experienced professionals looking to deepen their expertise.';
        }

        if (descLower.includes('free')) {
            goodToKnow.unshift('Free admission for all attendees');
        }

        if (descLower.includes('certificate')) {
            goodToKnow.push('Official certificate of participation');
        }
    }

    return {
        overview,
        goodToKnow: goodToKnow.slice(0, 5)
    };
}

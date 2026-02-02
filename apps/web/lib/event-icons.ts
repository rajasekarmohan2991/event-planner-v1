// Event icon generator based on event category/type
import {
    Calendar,
    Music,
    Briefcase,
    GraduationCap,
    Heart,
    Users,
    Trophy,
    Sparkles,
    Mic2,
    PartyPopper,
    Building2,
    Rocket,
    Palette,
    type LucideIcon
} from 'lucide-react';

export interface EventIconConfig {
    icon: LucideIcon;
    gradient: string;
    bgColor: string;
    iconColor: string;
}

export function getEventIcon(category?: string | null): EventIconConfig {
    const cat = (category || '').toLowerCase();

    if (cat.includes('conference') || cat.includes('business')) {
        return {
            icon: Briefcase,
            gradient: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        };
    }

    if (cat.includes('concert') || cat.includes('music')) {
        return {
            icon: Music,
            gradient: 'from-purple-500 to-pink-600',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        };
    }

    if (cat.includes('workshop') || cat.includes('training') || cat.includes('education')) {
        return {
            icon: GraduationCap,
            gradient: 'from-green-500 to-teal-600',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
        };
    }

    if (cat.includes('wedding') || cat.includes('marriage')) {
        return {
            icon: Heart,
            gradient: 'from-rose-500 to-pink-600',
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600'
        };
    }

    if (cat.includes('meetup') || cat.includes('networking')) {
        return {
            icon: Users,
            gradient: 'from-cyan-500 to-blue-600',
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600'
        };
    }

    if (cat.includes('sports') || cat.includes('competition') || cat.includes('tournament')) {
        return {
            icon: Trophy,
            gradient: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600'
        };
    }

    if (cat.includes('party') || cat.includes('celebration')) {
        return {
            icon: PartyPopper,
            gradient: 'from-fuchsia-500 to-purple-600',
            bgColor: 'bg-fuchsia-50',
            iconColor: 'text-fuchsia-600'
        };
    }

    if (cat.includes('seminar') || cat.includes('talk') || cat.includes('presentation')) {
        return {
            icon: Mic2,
            gradient: 'from-indigo-500 to-violet-600',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600'
        };
    }

    if (cat.includes('expo') || cat.includes('exhibition') || cat.includes('trade')) {
        return {
            icon: Building2,
            gradient: 'from-slate-500 to-gray-600',
            bgColor: 'bg-slate-50',
            iconColor: 'text-slate-600'
        };
    }

    if (cat.includes('launch') || cat.includes('startup')) {
        return {
            icon: Rocket,
            gradient: 'from-orange-500 to-red-600',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600'
        };
    }

    if (cat.includes('art') || cat.includes('creative') || cat.includes('design')) {
        return {
            icon: Palette,
            gradient: 'from-pink-500 to-rose-600',
            bgColor: 'bg-pink-50',
            iconColor: 'text-pink-600'
        };
    }

    if (cat.includes('gala') || cat.includes('fundraiser') || cat.includes('charity')) {
        return {
            icon: Sparkles,
            gradient: 'from-yellow-500 to-amber-600',
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600'
        };
    }

    // Default
    return {
        icon: Calendar,
        gradient: 'from-indigo-500 to-purple-600',
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600'
    };
}

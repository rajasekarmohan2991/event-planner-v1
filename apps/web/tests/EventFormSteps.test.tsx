import React from 'react';
import { render, screen } from './test-utils';
import { EventDetailsStep, MediaStep } from '@/components/events/EventFormSteps';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '',
}));

vi.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

// Mock Google Places lib since it's dynamically imported
vi.mock('@/lib/google-places', () => ({
    getCityPredictions: vi.fn().mockResolvedValue([]),
    getVenueSuggestions: vi.fn().mockResolvedValue([]),
}));

describe('EventFormSteps', () => {
    describe('EventDetailsStep (Step 2)', () => {
        it('hides venue/city fields for VIRTUAL events', () => {
            const initialData = {
                eventMode: 'VIRTUAL',
                type: 'Conference',
                category: 'Technology',
                capacity: 100
            };

            render(<EventDetailsStep onSubmit={vi.fn()} initialData={initialData} />);

            expect(screen.queryByLabelText(/City/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/Venue/i)).not.toBeInTheDocument();
            expect(screen.getByText(/Virtual events don't require venue/i)).toBeInTheDocument();
        });

        it('shows venue/city fields for IN_PERSON events', () => {
            const initialData = {
                eventMode: 'IN_PERSON',
                type: 'Conference',
                category: 'Technology',
                capacity: 100
            };

            render(<EventDetailsStep onSubmit={vi.fn()} initialData={initialData} />);

            expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Venue/i)).toBeInTheDocument();
        });
    });

    describe('MediaStep (Step 4)', () => {
        it('uses "Attendees" label for VIRTUAL events', () => {
            const initialData = {
                eventMode: 'VIRTUAL',
                capacity: 100
            };

            render(<MediaStep onSubmit={vi.fn()} initialData={initialData} />);

            expect(screen.getByText(/Expected Attendees/i)).toBeInTheDocument();
            expect(screen.getAllByText(/Attendees/i).length).toBeGreaterThan(0);
            expect(screen.queryByText(/Total Capacity.*seats/i)).not.toBeInTheDocument();
        });

        it('uses "Seats" label for IN_PERSON events', () => {
            const initialData = {
                eventMode: 'IN_PERSON',
                capacity: 100
            };

            render(<MediaStep onSubmit={vi.fn()} initialData={initialData} />);

            expect(screen.getByText(/Total Capacity/i)).toBeInTheDocument();
            expect(screen.getAllByText(/Seats/i).length).toBeGreaterThan(0);
        });
    });
});

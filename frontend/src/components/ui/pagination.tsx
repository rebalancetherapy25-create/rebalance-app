import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        // Simple logic for < 5 pages
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Complex logic with ellipses (simplified for this use case)
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-12 py-6">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl w-10 h-10 shadow-sm disabled:opacity-50"
            >
                <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>

            <div className="flex items-center gap-1.5 hidden sm:flex">
                {getPages().map((page, idx) => (
                    <React.Fragment key={idx}>
                        {page === '...' ? (
                            <span className="px-3 py-2 text-muted-foreground font-medium select-none">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                className={`w-10 h-10 rounded-xl font-bold transition-all text-sm flex items-center justify-center ${
                                    currentPage === page
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'bg-transparent text-foreground hover:bg-black/5'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="flex sm:hidden items-center justify-center px-4 font-medium text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl w-10 h-10 shadow-sm disabled:opacity-50"
            >
                <ChevronRight className="w-5 h-5 text-foreground" />
            </Button>
        </div>
    );
}

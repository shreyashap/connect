'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Camera } from 'lucide-react';

interface ProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
    const { user, setUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [about, setAbout] = useState(user?.about || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAvatarChange = (url: string) => {
        setAvatar(url);
        // Debounce or just update preview if it looks like a valid URL or is empty
        if (!url || url.startsWith('http')) {
            setPreviewAvatar(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            toast.error('Display name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await api.patch('/user/profile', {
                displayName: displayName.trim(),
                about: about.trim(),
                avatar: avatar.trim()
            });
            const updatedUser = res.data.user;

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profile updated successfully');
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-white/10 bg-zinc-900/95 text-zinc-100 backdrop-blur-2xl sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Edit Profile</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Personalize your profile settings. Changes are reflected instantly.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="group relative">
                            <Avatar className="h-28 w-28 border-4 border-zinc-800 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                <AvatarImage src={previewAvatar} className="object-cover" />
                                <AvatarFallback className="bg-zinc-800 text-3xl font-bold text-zinc-500">
                                    {displayName[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Camera className="h-8 w-8 text-white/80" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-zinc-200">{displayName || 'Your Name'}</h3>
                            <p className="text-xs text-zinc-500">Member since 2024</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Display Name</Label>
                            <Input
                                id="name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name"
                                className="h-11 border-white/5 bg-zinc-950/50 px-4 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="avatar" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Avatar URL</Label>
                            <Input
                                id="avatar"
                                value={avatar}
                                onChange={(e) => handleAvatarChange(e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                                className="h-11 border-white/5 bg-zinc-950/50 px-4 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="about" className="text-xs font-bold uppercase tracking-widest text-zinc-500">About</Label>
                            <Input
                                id="about"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                placeholder="Write a short bio..."
                                className="h-11 border-white/5 bg-zinc-950/50 px-4 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="submit"
                            className="h-11 w-full bg-zinc-100 font-bold text-zinc-900 hover:bg-white transition-all shadow-lg active:scale-95"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

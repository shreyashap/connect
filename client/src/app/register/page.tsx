'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: '',
            displayName: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setIsSubmitting(true);
            await registerUser(data);
            toast.success('Account created successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Join Connect to start messaging with friends
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="username">
                                    Username
                                </label>
                                <Input
                                    id="username"
                                    placeholder="johndoe"
                                    className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                                    {...form.register('username')}
                                />
                                {form.formState.errors.username && (
                                    <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="displayName">
                                    Full Name
                                </label>
                                <Input
                                    id="displayName"
                                    placeholder="John Doe"
                                    className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                                    {...form.register('displayName')}
                                />
                                {form.formState.errors.displayName && (
                                    <p className="text-xs text-red-500">{form.formState.errors.displayName.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="email">
                                Email
                            </label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="password">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                className="border-zinc-800 bg-zinc-950 text-zinc-100 focus-visible:ring-zinc-700"
                                {...form.register('password')}
                            />
                            {form.formState.errors.password && (
                                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Register'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-zinc-400">
                    <div>
                        Already have an account?{' '}
                        <Link href="/login" className="text-zinc-100 underline underline-offset-4 hover:text-zinc-300">
                            Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

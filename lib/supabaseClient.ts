import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tfotecboxtfkjhgxyrtg.supabase.co/"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3RlY2JveHRma2poZ3h5cnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Mjg0NzYsImV4cCI6MjA5MTAwNDQ3Nn0.6cxFCChJFk-tvvAaFZA-iAJUBzGh7dyubk7eXfj6CIc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.note_tags (
    note_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    CONSTRAINT note_tags_pkey PRIMARY KEY (note_id, tag_id),
    CONSTRAINT note_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id),
    CONSTRAINT note_tags_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.notes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    project_id uuid NOT NULL,
    title text NOT NULL,
    summary text,
    color text DEFAULT '#ffffff'::text,
    order_index integer NOT NULL DEFAULT 0,
    CONSTRAINT notes_pkey PRIMARY KEY (id),
    CONSTRAINT notes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.page_sections (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    note_id uuid NOT NULL,
    page_name text NOT NULL,
    description text,
    image_path text,
    order_index integer NOT NULL DEFAULT 0,
    CONSTRAINT page_sections_pkey PRIMARY KEY (id),
    CONSTRAINT page_sections_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id)
);
CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    is_archived boolean DEFAULT false,
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tags (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT tags_pkey PRIMARY KEY (id),
    CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
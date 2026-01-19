import { EventInput } from '@fullcalendar/core/index.js';

/**
 * Represents a FullCalendar.js calendar event
 * with additional user and description fields.
 *
 * Note: An event could have multiple users associated with it.
 * We could change the `userId` field to `userIds` and make it an array.
 * Or we could add an attendee field to the event.
 *
 * @property {number} userId - The ID of the user associated with the event
 * @property {string} description - The description of the event
 * @extends EventInput
 * @see https://fullcalendar.io/docs/event-object
 */
export interface CalendarEvent extends EventInput {
  userId: number;
  description?: string;
}

// Generated with ChatGPT
export const events: CalendarEvent[] = [
  {
    id: '1',
    title: 'Entretien',
    start: '2025-01-03T10:00:00',
    end: '2025-01-03T15:00:00',
    userId: 1,
    description: 'Entretien annuel',
  },

  {
    id: '2',
    title: 'Déjeuner',
    start: '2025-01-04T12:00:00',
    end: '2025-01-04T13:00:00',
    userId: 2,
    description: 'Déjeuner avec les collègues',
  },

  {
    id: '3',
    title: 'Rendez-vous',
    start: '2025-01-05T14:00:00',
    end: '2025-01-05T15:00:00',
    userId: 3,
    description: 'Rendez-vous client',
  },

  {
    id: '4',
    title: 'Réunion',
    start: '2025-01-10T09:00:00',
    end: '2025-01-10T10:00:00',
    userId: 1,
    description: "Réunion d'équipe (Daily)",
  },

  {
    id: '5',
    title: 'Atelier',
    start: '2025-01-11T11:00:00',
    end: '2025-01-11T12:30:00',
    userId: 2,
    description: 'Atelier de formation',
  },

  {
    id: '6',
    title: 'Webinaire Marketing',
    start: '2025-01-12T16:00:00',
    end: '2025-01-12T17:30:00',
    userId: 3,
    description: 'Participation au webinaire sur les tendances marketing 2025',
  },

  {
    id: '7',
    title: 'Pause Café',
    start: '2025-01-13T10:30:00',
    end: '2025-01-13T10:45:00',
    userId: 1,
    description: "Pause café avec l'équipe",
  },

  {
    id: '8',
    title: 'Séance de Brainstorming',
    start: '2025-01-14T14:00:00',
    end: '2025-01-14T16:00:00',
    userId: 2,
    description: 'Brainstorming pour le nouveau projet',
  },

  {
    id: '9',
    title: 'Visite Client',
    start: '2025-01-15T09:00:00',
    end: '2025-01-15T11:00:00',
    userId: 3,
    description: 'Visite chez le client pour présentation du projet',
  },

  {
    id: '10',
    title: 'Conférence Interne',
    start: '2025-01-16T13:00:00',
    end: '2025-01-16T15:00:00',
    userId: 1,
    description: 'Conférence sur les nouvelles technologies',
  },

  {
    id: '11',
    title: 'Formation en Ligne',
    start: '2025-01-17T10:00:00',
    end: '2025-01-17T12:00:00',
    userId: 2,
    description: 'Formation sur la gestion de projet agile',
  },

  {
    id: '12',
    title: 'Réunion de Suivi',
    start: '2025-01-18T09:30:00',
    end: '2025-01-18T10:30:00',
    userId: 3,
    description: "Suivi des tâches en cours avec l'équipe",
  },

  {
    id: '13',
    title: 'Développement Produit',
    start: '2025-01-19T08:00:00',
    end: '2025-01-19T17:00:00',
    userId: 1,
    description: 'Journée dédiée au développement du nouveau produit',
  },

  {
    id: '14',
    title: 'Networking Event',
    start: '2025-01-20T18:00:00',
    end: '2025-01-20T20:00:00',
    userId: 2,
    description: 'Événement de réseautage professionnel',
  },

  {
    id: '15',
    title: 'Séance de Coaching',
    start: '2025-01-21T15:00:00',
    end: '2025-01-21T16:30:00',
    userId: 3,
    description: 'Coaching individuel pour le développement personnel',
  },

  {
    id: '16',
    title: 'Audit Interne',
    start: '2025-01-22T09:00:00',
    end: '2025-01-22T12:00:00',
    userId: 1,
    description: "Audit des processus internes de l'entreprise",
  },

  {
    id: '17',
    title: 'Séminaire Bien-Être',
    start: '2025-01-23T10:00:00',
    end: '2025-01-23T13:00:00',
    userId: 2,
    description: 'Séminaire sur le bien-être au travail',
  },

  {
    id: '18',
    title: 'Lancement de Produit',
    start: '2025-01-24T14:00:00',
    end: '2025-01-24T16:00:00',
    userId: 3,
    description: 'Cérémonie de lancement du nouveau produit',
  },

  {
    id: '19',
    title: 'Réunion Stratégique',
    start: '2025-01-25T09:00:00',
    end: '2025-01-25T11:00:00',
    userId: 1,
    description: 'Définition des objectifs stratégiques pour le trimestre',
  },

  {
    id: '20',
    title: 'Team Building',
    start: '2025-01-26T13:00:00',
    end: '2025-01-26T17:00:00',
    userId: 2,
    description: 'Activités de team building en plein air',
  },

  {
    id: '21',
    title: 'Consultation Médicale',
    start: '2025-01-27T10:00:00',
    end: '2025-01-27T11:00:00',
    userId: 3,
    description: 'Visite annuelle chez le médecin',
  },

  {
    id: '22',
    title: 'Mise à Jour Logicielle',
    start: '2025-01-28T22:00:00',
    end: '2025-01-28T23:30:00',
    userId: 1,
    description: 'Mise à jour des systèmes informatiques',
  },

  {
    id: '23',
    title: 'Présentation Projet',
    start: '2025-01-29T09:00:00',
    end: '2025-01-29T10:30:00',
    userId: 2,
    description: 'Présentation du projet aux parties prenantes',
  },

  {
    id: '24',
    title: 'Révision Budgétaire',
    start: '2025-01-30T14:00:00',
    end: '2025-01-30T16:00:00',
    userId: 3,
    description: 'Révision du budget annuel avec le département financier',
  },

  {
    id: '25',
    title: 'Formation Sécurité',
    start: '2025-01-31T08:30:00',
    end: '2025-01-31T10:00:00',
    userId: 1,
    description: 'Formation sur les procédures de sécurité au travail',
  },
];

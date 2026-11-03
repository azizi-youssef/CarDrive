import { NextResponse } from 'next/server';

/**
 * Réponse 500 des routes API : le détail technique (base de données, pile d'appel…) est journalisé
 * côté serveur et n'est jamais renvoyé au navigateur, qui reçoit un message neutre.
 */
export function serverError(
  error: unknown,
  tag: string,
  message = 'Une erreur est survenue. Réessayez dans un instant.',
  status = 500
) {
  console.error(`[API ${tag}]`, error);
  return NextResponse.json({ success: false, error: message }, { status });
}

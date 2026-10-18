import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * ========================================================================
 * Webhook WhatsApp Business (Meta Graph API)
 * 
 * GET  : Vérification de l'URL du webhook par Meta (hub.challenge)
 * POST : Réception des messages entrants (clients répondant OUI/ANNULER)
 *        et des accusés de réception/livraison (sent/delivered/read/failed)
 * ========================================================================
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifiedChallenge = whatsappService.verifyWebhook(mode, token, challenge);

    if (verifiedChallenge) {
      console.log('[WhatsAppWebhook] Vérification du webhook Meta réussie.');
      return new Response(verifiedChallenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[WhatsAppWebhook] Échec de vérification du webhook Meta (token invalide ou mode incorrect).');
    return new Response('Vérification du webhook échouée.', { status: 403 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur de vérification';
    return new Response(errorMsg, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const summary = await whatsappService.processWebhookPayload(body);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur de traitement du webhook';
    console.error('[WhatsAppWebhook] Erreur lors du traitement:', errorMsg);

    // Meta préconise de renvoyer un statut 200 afin d'éviter les renvois en boucle
    return NextResponse.json({
      success: false,
      error: errorMsg,
    }, { status: 200 });
  }
}

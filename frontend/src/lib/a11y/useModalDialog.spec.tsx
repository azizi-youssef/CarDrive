// @vitest-environment jsdom
import '@/tests/setup/dom';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useModalDialog } from './useModalDialog';

function TestDialog({
  onClose,
  closeDisabled = false,
  label = 'Dialogue',
  children,
}: {
  onClose: () => void;
  closeDisabled?: boolean;
  label?: string;
  children?: React.ReactNode;
}) {
  const ref = useModalDialog<HTMLDivElement>(true, { onClose, closeDisabled });
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
      <button type="button">Premier</button>
      <input aria-label="Champ" />
      <button type="button" onClick={onClose}>
        Dernier
      </button>
      {children}
    </div>
  );
}

function Page({ closeDisabled = false }: { closeDisabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <main>
        <button type="button" onClick={() => setOpen(true)}>
          Ouvrir
        </button>
        <a href="#plus-loin">Lien de la page</a>
      </main>
      {open && <TestDialog onClose={() => setOpen(false)} closeDisabled={closeDisabled} />}
    </>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Ouvrir' }));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Premier' })).toHaveFocus());
  return dialog;
}

describe('useModalDialog — dialogue modal accessible', () => {
  it('place le focus dans le dialogue à l’ouverture', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await openDialog(user);
  });

  it('Tab et Maj+Tab bouclent à l’intérieur du dialogue', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await openDialog(user);

    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Champ' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Dernier' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Premier' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Dernier' })).toHaveFocus();
  });

  it('rend le reste de la page inerte, puis le restaure à la fermeture', async () => {
    const user = userEvent.setup();
    const { container } = render(<Page />);
    const main = container.querySelector('main')!;
    await openDialog(user);
    expect(main).toHaveAttribute('inert');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(main).not.toHaveAttribute('inert');
  });

  it('Échap ferme le dialogue et rend le focus au bouton d’ouverture', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await openDialog(user);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ouvrir' })).toHaveFocus();
  });

  it('Échap est sans effet quand la fermeture est bloquée (envoi en cours)', async () => {
    const user = userEvent.setup();
    render(<Page closeDisabled />);
    await openDialog(user);

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('bloque le défilement de la page tant que le dialogue est ouvert', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await openDialog(user);
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });

  it('dialogues imbriqués : Échap ne ferme que celui du premier plan', async () => {
    const user = userEvent.setup();
    const closeOuter = vi.fn();
    function Nested() {
      const [inner, setInner] = useState(false);
      return (
        <TestDialog onClose={closeOuter} label="Externe">
          <button type="button" onClick={() => setInner(true)}>
            Confirmer
          </button>
          {inner && <TestDialog onClose={() => setInner(false)} label="Interne" />}
        </TestDialog>
      );
    }
    render(<Nested />);
    await user.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(screen.getByRole('dialog', { name: 'Interne' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Interne' })).not.toBeInTheDocument();
    expect(closeOuter).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(closeOuter).toHaveBeenCalledTimes(1);
  });

  it('un nouveau rendu du parent ne déplace pas le focus pendant la saisie', async () => {
    const user = userEvent.setup();
    function Parent() {
      const [text, setText] = useState('');
      // onClose recréé à chaque rendu, comme un parent qui se ré-affiche (temps réel, saisie)
      const ref = useModalDialog<HTMLDivElement>(true, { onClose: () => setText('') });
      return (
        <div ref={ref} role="dialog" aria-label="Formulaire" tabIndex={-1}>
          <button type="button">Fermer</button>
          <input aria-label="Motif" value={text} onChange={(event) => setText(event.target.value)} />
        </div>
      );
    }
    render(<Parent />);
    const input = screen.getByRole('textbox', { name: 'Motif' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus());

    await user.click(input);
    await user.keyboard('bonjour');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(input).toHaveFocus();
    expect(input).toHaveValue('bonjour');
  });
});

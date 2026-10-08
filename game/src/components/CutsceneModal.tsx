import photo1 from '../assets/photos/Photo1.jpg';
import photo2 from '../assets/photos/Photo2.jpg';
import photo3 from '../assets/photos/Photo3.jpg';
import photo4 from '../assets/photos/Photo4.jpg';
import photo5 from '../assets/photos/Photo5.jpg';
import photo6 from '../assets/photos/Photo6.jpg';

export interface Cutscene {
  id: string;
  image: string;
  text: string;
}

export const introCutscenes: Cutscene[] = [
  {
    id: 'intro-1',
    image: photo1,
    text: 'You are an undergrad, and one day you approach your favourite professor for a summer research term and she hands you…',
  },
  {
    id: 'intro-2',
    image: photo2,
    text: '…an introduction to quantum computing textbook!!!',
  },
  {
    id: 'intro-3',
    image: photo3,
    text: 'Your research term has arrived and you’ve barely read the textbook!! Welp, time to attempt working on whatever your prof hands you and hope you can learn all these algorithms at the same time before she notices.',
  },
];

export const levelOneClearedCutscene: Cutscene[] = [
  {
    id: 'level-1-cleared',
    image: photo4,
    text: 'Thankfully, you now have some time to thoroughly (skim) that textbook past the first few chapters and learn about more than the amazing pauli twirling. Time to learn more, make tons of money, and move up that academic ladder.',
  },
];

export const loseCutscene: Cutscene[] = [
  {
    id: 'lose',
    image: photo5,
    text: 'You took too long to mitigate the errors in that circuit your professor handed you, and now she’s caught on to the fact that you didn’t read the textbook!! Looks like you lost your hard earned summer job… le big sad.',
  },
];

export const winCutscene: Cutscene[] = [
  {
    id: 'win',
    image: photo6,
    text: 'Wow! You managed to learn so many quantum algorithms and application strategies that your professor has recommended for you to go into grad school and get your masters!! Maybe even more degrees down the road! Looks like life as a graduate is about to begin.',
  },
];

export const CutsceneModal = ({
  cutscene,
  onClose,
}: {
  cutscene: Cutscene;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-game-text/15 bg-game-card shadow-2xl">
      <img
        src={cutscene.image}
        alt={cutscene.id}
        className="h-[60vh] w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <p className="max-w-3xl text-base leading-relaxed text-white drop-shadow-lg md:text-xl">
          {cutscene.text}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-game-accent px-5 py-2 font-semibold text-white transition hover:bg-game-accent/80"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
);

import React from 'react';

/**
 * Header Component
 *
 * This is a straightforward presentational component.
 * It displays the project title and a tagline.
 * All styling is done with Tailwind CSS utility classes.
 */
function HeaderG() {
  return (
    <header className="w-full pb-4 border-b border-cyan-700/50">
      {/* Main Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-white">
        {/* We use a gradient text effect for the "wow" factor */}
        <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Project P.R.I.D.E.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-lg md:text-xl text-gray-400">
        Police Recognition and Impact Dashboard for Excellence
      </p>
    </header>
  );
}

export default HeaderG;
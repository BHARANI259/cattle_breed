import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/history', label: 'History' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-forest/80 backdrop-blur-md border-b border-amber/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-full h-full text-amber group-hover:text-amber/80">
                {/* Cow head */}
                <ellipse cx="32" cy="32" rx="20" ry="22" fill="currentColor" />
                {/* Ears */}
                <ellipse cx="20" cy="12" rx="5" ry="8" fill="currentColor" />
                <ellipse cx="44" cy="12" rx="5" ry="8" fill="currentColor" />
                {/* Eyes */}
                <circle cx="26" cy="28" r="2" fill="#1a2e1a" />
                <circle cx="38" cy="28" r="2" fill="#1a2e1a" />
                {/* Snout */}
                <ellipse cx="32" cy="40" rx="6" ry="4" fill="#1a2e1a" opacity="0.3" />
              </svg>
            </div>
            <span className="text-lg font-bold text-cream hidden sm:inline">CattleVision</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-cream hover:text-amber transition-colors pb-2 border-b-2 border-transparent ${
                    isActive
                      ? 'text-amber border-b-2 border-amber'
                      : 'hover:border-amber/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-cream hover:text-amber transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-amber/20 mt-4 space-y-3">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber/20 text-amber'
                      : 'text-cream hover:bg-amber/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

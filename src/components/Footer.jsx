import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="text-center text-white/60 py-8 mt-12 border-t border-solid border-white/20 text-sm">
      <div className="flex justify-center gap-6 mb-4">
        <Link to="#" className="hover:text-white transition-colors">
          Support
        </Link>
        <Link to="#" className="hover:text-white transition-colors">
          Terms of Service
        </Link>
        <Link to="#" className="hover:text-white transition-colors">
          Privacy Policy
        </Link>
      </div>
      <p>© 2024 Deductly. All rights reserved.</p>
    </footer>
  )
}

export default Footer

import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="text-center text-text-secondary py-8 mt-12 border-t border-solid border-border-light text-sm">
      <div className="flex justify-center gap-6 mb-4">
        <Link to="#" className="hover:text-text-primary transition-colors">
          Support
        </Link>
        <Link to="#" className="hover:text-text-primary transition-colors">
          Terms of Service
        </Link>
        <Link to="#" className="hover:text-text-primary transition-colors">
          Privacy Policy
        </Link>
      </div>
      <p>© 2024 Deductly. All rights reserved.</p>
    </footer>
  )
}

export default Footer

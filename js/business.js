/**
 * @file business.js
 * @description Handles the business page testimonial carousel.
 */

document.addEventListener("DOMContentLoaded", () => {
    const cards = Array.from(document.getElementsByClassName('testimonial-card'));
    if (cards.length === 0) return;

    let current = 0;
    
    function updateCarousel() {

        const prev = (current - 1 + cards.length) % cards.length;
        const next = (current + 1) % cards.length;

        cards.forEach(card => card.classList.remove('active', 'prev', 'next'));
        cards[prev].classList.add('prev');
        cards[current].classList.add('active');
        cards[next].classList.add('next');
    }

    updateCarousel();

    setInterval(() => {
        current = (current + 1) % cards.length;
        updateCarousel();
    }, 3000);
});
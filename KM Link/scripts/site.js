const serviceOptions = {
    website: "Website or online store",
    bookings: "Bookings or business software",
    store: "Website or online store",
    stock: "Stock, delivery, or point of sale",
    pos: "Stock, delivery, or point of sale",
    search: "Search visibility",
    ai: "Automation or AI"
};

const appearanceStorageKey = "km-genius-appearance";
const appearanceOptions = {
    theme: ["dark", "light"],
    accent: ["violet", "mint", "sunset"],
    "text-size": ["small", "normal", "large"],
    font: ["jetbrains", "system"]
};

function initializeAppearanceSettings() {
    const settings = document.querySelector(".appearance-settings");

    if (!settings) {
        return;
    }

    const controls = [...settings.querySelectorAll("[data-appearance]")];
    const status = settings.querySelector(".appearance-status");
    const root = document.documentElement;
    const preferences = {
        theme: "dark",
        accent: "violet",
        "text-size": "normal",
        font: "jetbrains"
    };

    try {
        const savedPreferences = JSON.parse(localStorage.getItem(appearanceStorageKey) || "{}");

        Object.entries(appearanceOptions).forEach(([name, values]) => {
            if (values.includes(savedPreferences[name])) {
                preferences[name] = savedPreferences[name];
            }
        });
    } catch (error) {
        status.textContent = "Could not load saved display settings in this browser.";
    }

    const applyPreference = (name, value) => {
        if (!appearanceOptions[name]?.includes(value)) {
            return false;
        }

        preferences[name] = value;
        root.dataset[name === "text-size" ? "textSize" : name] = value;
        return true;
    };

    Object.entries(preferences).forEach(([name, value]) => {
        applyPreference(name, value);
    });

    controls.forEach(control => {
        const name = control.dataset.appearance;
        control.value = preferences[name];
        control.addEventListener("change", () => {
            if (!applyPreference(name, control.value)) {
                status.textContent = "That display setting is not available.";
                return;
            }

            try {
                localStorage.setItem(appearanceStorageKey, JSON.stringify(preferences));
                status.textContent = "Display settings saved.";
            } catch (error) {
                status.textContent = "Settings applied for this visit, but could not be saved.";
            }
        });
    });

    document.addEventListener("pointerdown", event => {
        if (settings.open && event.target instanceof Node && !settings.contains(event.target)) {
            settings.open = false;
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && settings.open) {
            settings.open = false;
            settings.querySelector("summary").focus();
        }
    });
}

function initializeNavigation() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navigationLinks = document.querySelector(".navigation__links");
    const navigation = menuToggle?.closest(".navigation");

    if (!menuToggle || !navigationLinks || !navigation) {
        return;
    }

    const setMenuOpen = isOpen => {
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        navigationLinks.classList.toggle("is-open", isOpen);
    };

    menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navigationLinks.addEventListener("click", event => {
        if (event.target instanceof Element && event.target.closest("a")) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("pointerdown", event => {
        if (
            menuToggle.getAttribute("aria-expanded") === "true"
            && event.target instanceof Node
            && !navigation.contains(event.target)
        ) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
            menuToggle.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            setMenuOpen(false);
        }
    });
}

function initializeScrollReveals() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
        return;
    }

    const revealElements = document.querySelectorAll(
        ".hero__copy, .hero__art, .subpage-hero__content, .subpage-hero__image, .section-heading, .stage-card, .product-card, .portfolio-card, .ai-card, .service-detail, .contact-copy, .contact-form, .contact-callout"
    );
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: "0px 0px -36px 0px",
        threshold: 0.12
    });

    revealElements.forEach((element, index) => {
        element.classList.add("reveal-item");
        element.style.setProperty("--reveal-delay", `${(index % 3) * 90}ms`);
        revealObserver.observe(element);
    });
}

function initializeHeroSlideshow() {
    const backdrop = document.querySelector("[data-hero-slideshow]");
    const toggle = document.querySelector("[data-hero-slideshow-toggle]");

    if (!backdrop || !toggle) {
        return;
    }

    const photos = [...backdrop.querySelectorAll("img")];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (photos.length < 2 || prefersReducedMotion) {
        photos[0]?.classList.add("is-active");
        toggle.hidden = true;
        return;
    }

    let activeIndex = 0;
    let paused = false;
    const updateToggle = () => {
        toggle.setAttribute("aria-label", paused ? "Resume background photos" : "Pause background photos");
        toggle.setAttribute("aria-pressed", String(paused));
        toggle.querySelector("span").textContent = paused ? "▶" : "||";
    };

    photos[activeIndex].classList.add("is-active");
    toggle.hidden = false;
    updateToggle();
    toggle.addEventListener("click", () => {
        paused = !paused;
        updateToggle();
    });

    window.setInterval(() => {
        if (paused || document.hidden) {
            return;
        }

        photos[activeIndex].classList.remove("is-active");
        activeIndex = (activeIndex + 1) % photos.length;
        photos[activeIndex].classList.add("is-active");
    }, 6500);
}

function initializeImageCarousels() {
    document.querySelectorAll("[data-image-carousel]").forEach(carousel => {
        const track = carousel.querySelector("[data-carousel-track]");
        const slides = [...carousel.querySelectorAll(".image-carousel__slide")];
        const previousButton = carousel.querySelector("[data-carousel-previous]");
        const nextButton = carousel.querySelector("[data-carousel-next]");
        const status = carousel.querySelector("[data-carousel-status]");

        if (!track || !slides.length || !previousButton || !nextButton || !status) {
            return;
        }

        const getStep = () => {
            const trackStyle = window.getComputedStyle(track);
            const gap = Number.parseFloat(trackStyle.columnGap) || 0;
            return slides[0].getBoundingClientRect().width + gap;
        };
        let lastStatus = "";

        const updateControls = () => {
            const step = getStep();
            const currentIndex = Math.round(track.scrollLeft / step);
            const visibleCount = Math.max(1, Math.round(track.clientWidth / step));
            const firstVisible = Math.min(currentIndex + 1, slides.length);
            const lastVisible = Math.min(currentIndex + visibleCount, slides.length);
            const nextStatus = `${firstVisible}–${lastVisible} of ${slides.length} photos`;

            previousButton.disabled = currentIndex === 0;
            nextButton.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;

            if (nextStatus !== lastStatus) {
                status.textContent = nextStatus;
                lastStatus = nextStatus;
            }
        };

        previousButton.disabled = false;
        nextButton.disabled = false;
        previousButton.addEventListener("click", () => {
            track.scrollBy({
                left: -getStep(),
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
            });
        });
        nextButton.addEventListener("click", () => {
            track.scrollBy({
                left: getStep(),
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
            });
        });

        track.addEventListener("scroll", updateControls, { passive: true });

        window.addEventListener("resize", updateControls);
        updateControls();
    });
}

function initializeContactForm() {
    const contactForm = document.querySelector(".contact-form");

    if (!contactForm) {
        return;
    }

    const formStatus = document.querySelector(".form-status");
    const emailFallback = document.querySelector(".email-fallback");
    const serviceSelect = contactForm.elements.namedItem("service");
    const serviceFromUrl = new URLSearchParams(window.location.search).get("service");

    if (serviceSelect && Object.hasOwn(serviceOptions, serviceFromUrl)) {
        serviceSelect.value = serviceOptions[serviceFromUrl];
    }

    contactForm.addEventListener("submit", event => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get("name").toString().trim();
        const recipient = contactForm.dataset.recipient;
        const subject = `Website enquiry from ${name}`;
        const message = [
            `Name: ${name}`,
            `Email: ${formData.get("email").toString().trim()}`,
            `Business: ${formData.get("business").toString().trim() || "Not provided"}`,
            `Phone: ${formData.get("phone").toString().trim() || "Not provided"}`,
            `Service: ${formData.get("service").toString()}`,
            "",
            "Project notes:",
            formData.get("message").toString().trim()
        ].join("\n");
        const emailUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        emailFallback.href = emailUrl;
        formStatus.dataset.state = "success";
        formStatus.textContent = "Your email draft is ready. It will open in your email app for you to review and send.";
        window.location.href = emailUrl;
    });
}

function initializeButtonRipples() {
    document.querySelectorAll(".button--ripple").forEach(button => {
        button.addEventListener("click", event => {
            const ripple = document.createElement("span");
            const size = Math.max(button.clientWidth, button.clientHeight);
            const rect = button.getBoundingClientRect();

            ripple.classList.add("ripple");
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
            button.appendChild(ripple);

            ripple.addEventListener("animationend", () => {
                ripple.remove();
            });
        });
    });
}

function initializeBackgroundRipples() {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleMotionPreferenceChange = event => {
        if (event.matches) {
            document.querySelectorAll(".background-ripple").forEach(ripple => {
                ripple.remove();
            });
        }
    };

    if (typeof motionPreference.addEventListener === "function") {
        motionPreference.addEventListener("change", handleMotionPreferenceChange);
    } else {
        motionPreference.addListener(handleMotionPreferenceChange);
    }

    document.addEventListener("click", event => {
        if (
            motionPreference.matches
            || !(event.target instanceof Element)
            || event.target.closest("a, button, input, select, textarea, summary, [role='button'], [contenteditable='true']")
        ) {
            return;
        }

        document.querySelectorAll(".background-ripple").forEach(ripple => {
            ripple.remove();
        });

        const size = 80;
        const ripple = document.createElement("span");

        ripple.className = "background-ripple";
        ripple.setAttribute("aria-hidden", "true");
        ripple.style.left = `${event.clientX - size / 2}px`;
        ripple.style.top = `${event.clientY - size / 2}px`;
        ripple.style.setProperty("--ripple-scale", "2.5");
        const removeRipple = () => ripple.remove();

        ripple.addEventListener("animationend", removeRipple, { once: true });
        ripple.addEventListener("animationcancel", removeRipple, { once: true });
        document.body.appendChild(ripple);
    });
}

function initializeDesignerCredits() {
    const credits = [...document.querySelectorAll(".designer-credit")];

    if (!credits.length) {
        return;
    }

    document.addEventListener("pointerdown", event => {
        credits.forEach(credit => {
            if (credit.open && event.target instanceof Node && !credit.contains(event.target)) {
                credit.open = false;
            }
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") {
            return;
        }

        credits.forEach(credit => {
            if (credit.open) {
                credit.open = false;
                credit.querySelector("summary").focus();
            }
        });
    });
}

initializeNavigation();
initializeAppearanceSettings();
initializeScrollReveals();
initializeHeroSlideshow();
initializeImageCarousels();
initializeContactForm();
initializeButtonRipples();
initializeBackgroundRipples();
initializeDesignerCredits();
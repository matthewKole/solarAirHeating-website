(function () {
      const sections = document.querySelectorAll(".cp-section");
      const links    = document.querySelectorAll(".cp-toc-list a");
      if (!sections.length || !links.length) return;
 
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              links.forEach((link) => {
                link.classList.toggle(
                  "is-active",
                  link.getAttribute("href") === "#" + entry.target.id
                );
              });
            }
          });
        },
        { rootMargin: "-20% 0px -70% 0px" }
      );
 
      sections.forEach((s) => observer.observe(s));
    })();
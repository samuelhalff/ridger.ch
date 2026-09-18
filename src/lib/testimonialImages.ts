// Static imports for testimonial avatars to enable automatic blur placeholders
// Map the known avatar paths used in testimonials-carousel.tsx to imported images

import avatarMale from "@/public/assets/testimonials/avatar.avif";
import avatarFemale from "@/public/assets/testimonials/avatar-female.avif";

export const testimonialAvatarMap: Record<string, typeof avatarMale> = {
  "/assets/testimonials/avatar.avif": avatarMale,
  "/assets/testimonials/avatar-female.avif": avatarFemale,
};

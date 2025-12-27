import Carousel from "./Carousel.astro";
import {
  type CarouselApi,
  type CarouselManager,
  type CarouselOptions,
  initCarousel,
} from "./carousel-script";
import CarouselContent from "./CarouselContent.astro";
import CarouselItem from "./CarouselItem.astro";
import CarouselNext from "./CarouselNext.astro";
import CarouselPrevious from "./CarouselPrevious.astro";
import CarouselDots from "./CarouselDots.astro";

export {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselManager,
  CarouselNext,
  type CarouselOptions,
  CarouselPrevious,
  initCarousel,
};

export default {
  Root: Carousel,
  Content: CarouselContent,
  Dots: CarouselDots,
  Item: CarouselItem,
  Next: CarouselNext,
  Previous: CarouselPrevious,
  init: initCarousel,
};

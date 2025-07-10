'use client';

import { useState, useEffect } from 'react';
import Image, { type ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc: string;
}

const ImageWithFallback = ({ src, fallbackSrc, ...props }: ImageWithFallbackProps) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setError(false);
  }, [src]);

  return (
    <Image
      {...props}
      src={error ? fallbackSrc : currentSrc}
      onError={() => {
        if (!error) {
          setError(true);
        }
      }}
    />
  );
};

export default ImageWithFallback;

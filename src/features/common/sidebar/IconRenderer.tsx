import type { ComponentType, SVGProps } from 'react';

interface Props {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export default function IconRenderer({ icon: IconComponent }: Props) {
	return <IconComponent width={20} height={20} strokeWidth={1.5} />;
}

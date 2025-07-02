import type { ComponentProps } from 'react';
import { Laptop, Smartphone, Sofa, Car, Package } from 'lucide-react';
import type { WarrantyCategory } from '@/lib/types';

interface CategoryIconProps extends ComponentProps<'svg'> {
  category: WarrantyCategory;
}

export default function CategoryIcon({ category, ...props }: CategoryIconProps) {
  switch (category) {
    case 'Electronics':
      return <Laptop {...props} />;
    case 'Appliances':
      return <Smartphone {...props} />;
    case 'Furniture':
      return <Sofa {...props} />;
    case 'Vehicles':
      return <Car {...props} />;
    default:
      return <Package {...props} />;
  }
}

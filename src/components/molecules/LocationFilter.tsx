import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';

import { LocationSelector } from './LocationSelector';

const FilterContainer = styled(View)`
  margin-bottom: 0px;
`;

export interface LocationFilterProps {
  selectedLocationId: string | null;
  onSelect: (locationId: string | null) => void;
  counts?: Record<string, number>;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  selectedLocationId,
  onSelect,
  counts = {},
}) => {
  return (
    <FilterContainer>
      <LocationSelector
        selectedLocationId={selectedLocationId}
        onSelect={onSelect}
        showAllOption={true}
        showCounts={true}
        counts={counts}
      />
    </FilterContainer>
  );
};


export class HierarchyMetadataUpdateDto {
  nodeId: string;
  nodeType: string;
  updatedBy: string;
  metadata: {
    cnbId: string;
  };
  trackingId: string;
}

import type { Node, Edge } from '@xyflow/react';

export interface DBFootprint {
  id: number;
  user_id: number;
  platform_name: string;
  category: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string | null;
}

export function generateNodesAndEdges(
  userLabel: string, 
  footprints: DBFootprint[]
): { nodes: Node[], edges: Edge[] } {
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. CENTER POINT: Position at the center of a wide canvas
  const centerX = 800;
  const centerY = 800;

  nodes.push({
    id: 'core',
    type: 'coreNode',
    position: { x: centerX, y: centerY },
    data: { label: userLabel }
  });

  if (footprints.length === 0) {
    return { nodes, edges };
  }

  // 2. GROUP DATA BY CATEGORY
  const categories = Array.from(new Set(footprints.map(f => f.category)));
  
  const categoryRadius = 260;     // Distance of category ring from center
  const basePlatformRadius = 480; // Base distance of outer platform ring

  // 3. DISTRIBUTE CATEGORIES CIRCULARLY (Inner Ring)
  categories.forEach((cat, catIndex) => {
    const catNodeId = `cat-${cat.toLowerCase()}`;
    
    const catAngle = (catIndex / categories.length) * 2 * Math.PI;
    const catX = centerX + categoryRadius * Math.cos(catAngle);
    const catY = centerY + categoryRadius * Math.sin(catAngle);

    nodes.push({
      id: catNodeId,
      type: 'categoryNode',
      position: { x: catX, y: catY },
      data: { label: cat }
    });

    edges.push({
      id: `e-core-${catNodeId}`,
      source: 'core',
      target: catNodeId,
      className: 'stroke-[4px] stroke-black'
    });

    // 4. DISTRIBUTE PLATFORMS STRATEGICALLY (Anti-Overlap)
    const platformsInCat = footprints.filter(f => f.category === cat);
    
    platformsInCat.forEach((plat, platIndex) => {
      const platNodeId = `app-${plat.id}`;
      
      let  platAngle;
      
      if (categories.length === 1) {
        // TRICK 1: If only 1 category exists, distribute across the full 360 degrees
        platAngle = (platIndex / platformsInCat.length) * 2 * Math.PI;
      } else {
        // If multiple categories exist, distribute within each category's arc segment
        const angleRangeForCat = (2 * Math.PI) / categories.length;
        const startAngle = catAngle - angleRangeForCat / 3;
        
        platAngle = platformsInCat.length > 1 
          ? startAngle + (platIndex / (platformsInCat.length - 1)) * (angleRangeForCat * 0.66)
          : catAngle;
      }

      // TRICK 2: STAGGERED RING LAYERS (Create 3 layers of outer rings)
      const ringLayer = platIndex % 3; 
      const dynamicRadius = basePlatformRadius + ringLayer * 180; // 180px gap between rings

      // Calculate final coordinates
      const platX = centerX + dynamicRadius * Math.cos(platAngle);
      const platY = centerY + dynamicRadius * Math.sin(platAngle);

      nodes.push({
        id: platNodeId,
        type: 'platformNode',
        position: { x: platX, y: platY },
        data: { 
          label: plat.platform_name, 
          risk: plat.risk_level, 
          desc: plat.description || 'No description available.' 
        }
      });

      edges.push({
        id: `e-${catNodeId}-${platNodeId}`,
        source: catNodeId,
        target: platNodeId,
        className: 'stroke-[3px] stroke-black'
      });
    });
  });

  return { nodes, edges };
}
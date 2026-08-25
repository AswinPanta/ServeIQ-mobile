#!/usr/bin/env python3
"""
Extract Nepal outer boundary from provinces SVG, optimized for size.
"""

import re
import numpy as np
from shapely.geometry import MultiPolygon, Polygon
from shapely.ops import unary_union
from shapely.validation import make_valid


def parse_svg_d(d_string):
    """Parse SVG path d attribute into commands."""
    tokens = re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d_string)
    commands = []
    i = 0
    while i < len(tokens):
        cmd = tokens[i]
        if cmd.isalpha():
            i += 1
            nums = []
            while i < len(tokens) and not tokens[i].isalpha():
                nums.append(float(tokens[i]))
                i += 1
            commands.append((cmd, nums))
        else:
            i += 1
    return commands


def commands_to_points(commands, samples_per_curve=3):
    """Convert SVG commands to points, sampling curves."""
    points = []
    cx, cy = 0, 0
    mx, my = 0, 0
    
    for cmd, nums in commands:
        if cmd == 'M':
            mx, my = nums[0], nums[1]
            cx, cy = mx, my
            points.append((cx, cy))
        elif cmd == 'm':
            mx += nums[0]; my += nums[1]
            cx, cy = mx, my
            points.append((cx, cy))
        elif cmd == 'L':
            for j in range(0, len(nums), 2):
                cx, cy = nums[j], nums[j+1]
                points.append((cx, cy))
        elif cmd == 'l':
            for j in range(0, len(nums), 2):
                cx += nums[j]; cy += nums[j+1]
                points.append((cx, cy))
        elif cmd == 'H':
            cx = nums[0]; points.append((cx, cy))
        elif cmd == 'h':
            cx += nums[0]; points.append((cx, cy))
        elif cmd == 'V':
            cy = nums[0]; points.append((cx, cy))
        elif cmd == 'v':
            cy += nums[0]; points.append((cx, cy))
        elif cmd in ('C', 'c'):
            is_rel = cmd == 'c'
            for j in range(0, len(nums), 6):
                x1 = cx + nums[j] if is_rel else nums[j]
                y1 = cy + nums[j+1] if is_rel else nums[j+1]
                x2 = cx + nums[j+2] if is_rel else nums[j+2]
                y2 = cy + nums[j+3] if is_rel else nums[j+3]
                x3 = cx + nums[j+4] if is_rel else nums[j+4]
                y3 = cy + nums[j+5] if is_rel else nums[j+5]
                for t in np.linspace(0, 1, samples_per_curve + 1)[1:]:
                    bx = (1-t)**3*cx + 3*(1-t)**2*t*x1 + 3*(1-t)*t**2*x2 + t**3*x3
                    by = (1-t)**3*cy + 3*(1-t)**2*t*y1 + 3*(1-t)*t**2*y2 + t**3*y3
                    points.append((bx, by))
                cx, cy = x3, y3
        elif cmd in ('S', 's'):
            is_rel = cmd == 's'
            for j in range(0, len(nums), 4):
                x2 = cx + nums[j] if is_rel else nums[j]
                y2 = cy + nums[j+1] if is_rel else nums[j+1]
                x3 = cx + nums[j+2] if is_rel else nums[j+2]
                y3 = cy + nums[j+3] if is_rel else nums[j+3]
                for t in np.linspace(0, 1, samples_per_curve + 1)[1:]:
                    bx = (1-t)**3*cx + 3*(1-t)**2*t*cx + 3*(1-t)*t**2*x2 + t**3*x3
                    by = (1-t)**3*cy + 3*(1-t)**2*t*cy + 3*(1-t)*t**2*y2 + t**3*y3
                    points.append((bx, by))
                cx, cy = x3, y3
        elif cmd in ('Q', 'q'):
            is_rel = cmd == 'q'
            for j in range(0, len(nums), 4):
                x1 = cx + nums[j] if is_rel else nums[j]
                y1 = cy + nums[j+1] if is_rel else nums[j+1]
                x2 = cx + nums[j+2] if is_rel else nums[j+2]
                y2 = cy + nums[j+3] if is_rel else nums[j+3]
                for t in np.linspace(0, 1, samples_per_curve + 1)[1:]:
                    bx = (1-t)**2*cx + 2*(1-t)*t*x1 + t**2*x2
                    by = (1-t)**2*cy + 2*(1-t)*t*y1 + t**2*y2
                    points.append((bx, by))
                cx, cy = x2, y2
        elif cmd in ('Z', 'z'):
            cx, cy = mx, my
    
    return points


def simplify_douglas_peucker(points, tolerance):
    """Ramer-Douglas-Peucker line simplification."""
    if len(points) <= 2:
        return points
    
    # Find the point with the maximum distance from the line between first and last
    start = np.array(points[0])
    end = np.array(points[-1])
    line_vec = end - start
    line_len = np.linalg.norm(line_vec)
    
    if line_len < 1e-10:
        return [points[0], points[-1]]
    
    line_unit = line_vec / line_len
    
    max_dist = 0
    max_idx = 0
    for i, p in enumerate(points[1:-1], 1):
        v = np.array(p) - start
        proj = np.dot(v, line_unit)
        proj_point = start + proj * line_unit
        dist = np.linalg.norm(np.array(p) - proj_point)
        if dist > max_dist:
            max_dist = dist
            max_idx = i
    
    if max_dist > tolerance:
        left = simplify_douglas_peucker(points[:max_idx+1], tolerance)
        right = simplify_douglas_peucker(points[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [points[0], points[-1]]


def main():
    svg_file = "/Users/admin/Downloads/np.svg"
    
    with open(svg_file, 'r') as f:
        content = f.read()
    
    # Extract path d strings
    path_pattern = re.compile(r'<path\s+d="([^"]+)"[^>]*>', re.DOTALL)
    d_strings = path_pattern.findall(content)
    print(f"Found {len(d_strings)} paths")
    
    polygons = []
    for i, d_str in enumerate(d_strings):
        try:
            commands = parse_svg_d(d_str)
            points = commands_to_points(commands, samples_per_curve=3)
            # Clean duplicates
            cleaned = [points[0]]
            for p in points[1:]:
                if abs(p[0] - cleaned[-1][0]) > 0.1 or abs(p[1] - cleaned[-1][1]) > 0.1:
                    cleaned.append(p)
            if len(cleaned) >= 3:
                poly = Polygon(cleaned)
                if not poly.is_valid:
                    poly = make_valid(poly)
                if not poly.is_empty:
                    polygons.append(poly)
                    print(f"  Path {i+1}: area={poly.area:.0f}")
        except Exception as e:
            print(f"  Path {i+1}: error - {e}")
    
    print(f"\n{len(polygons)} valid polygons")
    
    # Union
    merged = unary_union(polygons)
    # Handle GeometryCollection by extracting polygons
    from shapely.geometry import GeometryCollection
    if isinstance(merged, GeometryCollection):
        polys = [g for g in merged.geoms if isinstance(g, (Polygon, MultiPolygon))]
        if polys:
            merged = unary_union(polys)
        else:
            print("ERROR: No polygons in result")
            return
    if isinstance(merged, MultiPolygon):
        merged = max(merged.geoms, key=lambda p: p.area)
    if not merged.is_valid:
        merged = make_valid(merged)
    if isinstance(merged, MultiPolygon):
        merged = max(merged.geoms, key=lambda p: p.area)
    
    exterior = list(merged.exterior.coords)
    print(f"Exterior points: {len(exterior)}")
    
    # Simplify with Douglas-Peucker (tolerance 1.5 in original coords)
    simplified = simplify_douglas_peucker(exterior, tolerance=1.5)
    # Ensure closure
    if simplified[-1] != simplified[0]:
        simplified.append(simplified[0])
    print(f"Simplified points: {len(simplified)}")
    
    # Bounding box
    xs = [c[0] for c in simplified]
    ys = [c[1] for c in simplified]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    # Scale to 100x80
    padding = 2
    target_w = 100 - 2 * padding
    target_h = 80 - 2 * padding
    orig_w = max_x - min_x
    orig_h = max_y - min_y
    scale = min(target_w / orig_w, target_h / orig_h)
    offset_x = padding + (target_w - orig_w * scale) / 2
    offset_y = padding + (target_h - orig_h * scale) / 2
    
    ox = offset_x - min_x * scale
    oy = offset_y - min_y * scale
    
    parts = [f"M{simplified[0][0] * scale + ox:.1f},{simplified[0][1] * scale + oy:.1f}"]
    for x, y in simplified[1:]:
        parts.append(f"L{x * scale + ox:.1f},{y * scale + oy:.1f}")
    parts.append("Z")
    path_string = "".join(parts)
    
    js = f"""// Auto-generated Nepal outer boundary from provinces SVG
// Original viewBox: 0 0 1000 569 -> Scaled to: 0 0 100 80
// {len(simplified)} boundary points, simplified from {len(exterior)} original points
const NEPAL_MAP = '{path_string}';

export default NEPAL_MAP;
"""
    
    out = "/Users/admin/Desktop/Stay_Easy/tmp-nepal-outline.js"
    with open(out, 'w') as f:
        f.write(js)
    
    print(f"\nSaved: {out}")
    print(f"Path length: {len(path_string)} chars")
    print(f"Bounds in 100x80: X[{min_x * scale + ox:.1f}, {max_x * scale + ox:.1f}] Y[{min_y * scale + oy:.1f}, {max_y * scale + oy:.1f}]")


if __name__ == "__main__":
    main()

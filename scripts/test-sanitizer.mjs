import { ContentSanitizer } from '../src/services/parsers/contentSanitizer.ts';

console.log('Testing ContentSanitizer...');

// Test 1: Table of Contents
const tocPage = `Table of Contents
Chapter 1: Introduction to Algorithms . . . . . . . . . . 1
Chapter 2: Graph Theory and Shortest Paths . . . . . . . 15
Chapter 3: Quantum Annealing and Logistics . . . . . . . 34
Chapter 4: NP-Hard Problems and Approximations . . . . . 52
Index . . . . . . . . . . . . . . . . . . . . . . . . . 89`;

const res1 = ContentSanitizer.shouldSkipSection('Table of Contents', tocPage);
console.log('TOC Test result:', res1);
if (!res1.skip) throw new Error('Failed to detect Table of Contents');

// Test 2: Index Page
const indexPage = `Index
Algorithm complexity, 12, 14, 25-28
Combinatorial optimization, 45, 67, 88
Graph traversal, 15, 18-22
NP-complete, 52, 55, 60
Quantum superposition, 34, 38-42
Traveling salesperson, 35, 40`;

const res2 = ContentSanitizer.shouldSkipSection('Index', indexPage);
console.log('Index Test result:', res2);
if (!res2.skip) throw new Error('Failed to detect Index page');

// Test 3: Copyright Page
const copyrightPage = `Copyright © 2026 Academic Press Inc.
All rights reserved. No part of this publication may be reproduced or transmitted in any form.
Library of Congress Cataloging-in-Publication Data.
ISBN 978-0-12-345678-9
Printed in the United States of America.`;

const res3 = ContentSanitizer.shouldSkipSection('Copyright', copyrightPage);
console.log('Copyright Test result:', res3);
if (!res3.skip) throw new Error('Failed to detect Copyright page');

// Test 4: Blank / Low value page
const blankPage = `Page 42`;
const res4 = ContentSanitizer.shouldSkipSection('Page 42', blankPage);
console.log('Blank page Test result:', res4);
if (!res4.skip) throw new Error('Failed to detect blank/noise page');

// Test 5: Substantive Lecture Chapter (should NOT skip)
const chapterPage = `Section 1: Quantum Annealing Fundamentals
In this chapter, we explore how quantum tunneling enables optimization algorithms to traverse high-potential energy barriers without classical thermal excitation. This offers quadratic to exponential speedups for complex freight logistics networks.`;

const res5 = ContentSanitizer.shouldSkipSection('Section 1', chapterPage);
console.log('Substantive Chapter result:', res5);
if (res5.skip) throw new Error('Incorrectly skipped substantive chapter');

// Test 6: Text Cleaning & Math translation
const mathText = `We analyze the worst case complexity O(n!) vs. O(n^2), e.g. for TSP problems. Figure 1.2: Energy barrier chart.`;
const cleaned = ContentSanitizer.cleanContentForAudio(mathText);
console.log('Cleaned math text:', cleaned);
if (!cleaned.includes('Big O of N factorial') || !cleaned.includes('squared') || cleaned.includes('Figure 1.2')) {
  throw new Error('Math / caption translation failed');
}

console.log('✅ ALL 6 CONTENT SANITIZER TESTS PASSED SUCCESSFULLY!');

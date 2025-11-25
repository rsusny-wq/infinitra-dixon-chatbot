# PDD Product Planning Script

## Overview

This script guides you through creating comprehensive product planning artifacts that translate business requirements into actionable product development plans. It follows a dual-pathway approach and uses hybrid validation to ensure quality while maintaining flexibility.

The Product Planning module transforms business foundation artifacts into product roadmaps, epics, and user stories that will drive architecture and development decisions. All outputs are designed to be LLM-agnostic and self-contained.

## Parameters

- **project_name** (required): The name of your project
- **project_dir** (required): The base directory where Business Foundation artifacts are stored
- **input_method** (required): How you want to provide product information
  - "existing": You have existing product documents to analyze and enhance
  - "working-backwards": Build product artifacts from Business Foundation using guided methodology

**Constraints for parameter acquisition:**
- The model MUST ask for all required parameters upfront in a single prompt rather than one at a time
- The model MUST support both input methods and adapt the process accordingly
- The model MUST confirm successful acquisition of all parameters before proceeding
- The model MUST validate that Business Foundation prerequisites exist before starting

## Prerequisites

**This module requires completed Business Foundation artifacts.**

The model MUST validate these prerequisites exist:
- Business Foundation module completed
- Business Foundation handoff summary available
- Required Business Foundation artifacts present

## Steps

### Step 1: Business Foundation Prerequisites Validation

Validate that required Business Foundation artifacts exist and assess quality enhancement opportunities.

**Constraints:**
- The model MUST validate mandatory Business Foundation artifacts before proceeding
- The model MUST provide smart recommendations for missing optional artifacts
- The model MUST create prerequisites validation report
- The model MUST allow user to proceed with awareness of quality trade-offs

#### Step 1A: Mandatory Prerequisites Validation

The model MUST validate these REQUIRED artifacts exist:

```markdown
## Prerequisites Validation - REQUIRED

### ART-001: Stakeholder Interviews → REQUIRED for Epic Definition
- **File Location**: `{project_dir}/business/stakeholder-interviews.md`
- **Validation**: [Check if file exists and has content]
- **Usage**: Stakeholder needs and pain points will inform epic scope and user stories
- **Status**: ✅ Found / ❌ MISSING - CANNOT PROCEED

### ART-002: Business Case → REQUIRED for Product Roadmap Prioritization  
- **File Location**: `{project_dir}/business/business-case.md`
- **Validation**: [Check if file exists and has ROI data]
- **Usage**: Business value and priorities will drive product roadmap sequencing
- **Status**: ✅ Found / ❌ MISSING - CANNOT PROCEED

### ART-008: Business Requirements Document → REQUIRED for User Story Creation
- **File Location**: `{project_dir}/business/business-requirements.md`
- **Validation**: [Check if file exists and has functional requirements]
- **Usage**: Functional requirements will be translated into detailed user stories
- **Status**: ✅ Found / ❌ MISSING - CANNOT PROCEED

## STOP: Cannot proceed without all mandatory Business Foundation artifacts
```

#### Step 1B: Quality Enhancement Recommendations

The model MUST check for key optional Business Foundation artifacts and provide recommendations:

```markdown
## Quality Enhancement Recommendations

### ART-006: User Research → HIGHLY RECOMMENDED
- **File Location**: `{project_dir}/business/user-research.md`
- **Status**: ✅ Found / ⚠️ NOT FOUND
- **Quality Impact**: +80% better user-centered design and product-market fit
- **Skip Impact**: User stories will be based on stakeholder assumptions vs direct user research
- **Recommendation**: **STRONGLY CONSIDER** creating before proceeding with user stories
- **Time Investment**: 8-12 hours to create comprehensive user research

### ART-003: Market Analysis → RECOMMENDED  
- **File Location**: `{project_dir}/business/market-analysis.md`
- **Status**: ✅ Found / ⚠️ NOT FOUND
- **Quality Impact**: +40% better product-market fit and competitive positioning
- **Skip Impact**: Product roadmap prioritization will lack market validation data
- **Recommendation**: **CONSIDER** creating for better feature prioritization
- **Time Investment**: 4-6 hours to create market analysis

### ART-004: Competitive Analysis → RECOMMENDED
- **File Location**: `{project_dir}/business/competitive-analysis.md`
- **Status**: ✅ Found / ⚠️ NOT FOUND
- **Quality Impact**: +60% better competitive positioning and differentiation
- **Skip Impact**: Product features may duplicate competitors or miss differentiation opportunities
- **Recommendation**: **CONSIDER** creating for competitive markets
- **Time Investment**: 6-8 hours to create competitive analysis

## Proceed Decision
**Based on this analysis, would you like to:**
A) **Proceed** with Product Planning using available artifacts
B) **Add missing recommended artifacts** to Business Foundation first
C) **Review** Business Foundation artifacts for completeness

**If you choose to proceed:** You understand the quality trade-offs and accept the impact on product planning quality.
```

### Step 2: Product Planning Artifact Selection

Determine specific Product Planning artifacts to create based on cross-module dependency analysis.

**Constraints:**
- The model MUST present dependency-based artifact selection focusing on Architecture module needs
- The model MUST explain why each artifact is mandatory vs optional
- The model MUST document artifact selections in `{project_dir}/product/module-status.md`

#### Step 2A: Cross-Module Dependency-Based Artifact Selection

The model MUST present artifacts based on what the **Architecture & Design module** needs to proceed:

```markdown
## Product Planning Artifact Selection

### MANDATORY Artifacts (Block Architecture & Design Module)
These artifacts are **REQUIRED** because the Architecture & Design module cannot proceed without them:

#### ART-018: Product Roadmap → **MANDATORY**
- **Blocks in Architecture**: System planning and phasing decisions
- **Why Critical**: Architecture needs product timeline and feature priorities to design system phases and components
- **Architecture Impact**: Without product roadmap, architecture cannot plan system evolution and scaling
- **Template**: `AgileAI/templates/product/ART-018-product-roadmap.md`

#### ART-019: Epics → **MANDATORY**  
- **Blocks in Architecture**: System scope and component boundary definition
- **Why Critical**: Architecture needs epic scope to understand system boundaries and major components
- **Architecture Impact**: Without epics, architecture cannot determine system complexity and integration points
- **Template**: `AgileAI/templates/product/ART-019-epics.md`

#### ART-030: User Stories → **MANDATORY**
- **Blocks in Architecture**: Detailed functional requirements for system design
- **Why Critical**: Architecture needs user stories to understand detailed functional requirements and data flows
- **Architecture Impact**: Without user stories, architecture cannot design appropriate system interfaces and data models
- **Template**: `AgileAI/templates/product/ART-030-user-stories.md`

**Total Mandatory Artifacts: 3**
**Estimated Time Investment: 12-20 hours**
**Module Readiness**: These 3 artifacts are sufficient for Architecture module to proceed

---

### OPTIONAL Artifacts (Quality Enhancing)
These artifacts **improve quality** but don't block the Architecture module. They enhance current work or prepare for later modules:

#### User Experience Enhancement

□ **ART-028: UI/UX Wireframes**
- **Enhances in Product Planning**: ART-030 (User Stories) - provides visual context for story creation
- **Quality Impact**: +70% better user story quality and frontend architecture planning
- **Time Investment**: 8-16 hours
- **Skip Impact**: User stories will lack visual context, frontend architecture will need separate UX planning
- **Later Validation**: **Will enhance Architecture module** - provides UI/UX context for frontend architecture
- **Template**: `AgileAI/templates/product/ART-028-uiux-wireframes.md`

□ **ART-031: Acceptance Criteria**
- **Enhances in Product Planning**: ART-030 (User Stories) - provides detailed testable conditions
- **Quality Impact**: +80% better development clarity and testing preparation
- **Time Investment**: 6-12 hours
- **Skip Impact**: User stories will have basic acceptance criteria, detailed testing criteria will need separate definition
- **Later Validation**: **Will be required by Development module** - creating now provides better product context
- **Template**: `AgileAI/templates/product/ART-031-acceptance-criteria.md`

#### Release & Project Management

□ **ART-036: Release Plan**
- **Enhances in Product Planning**: Coordination and stakeholder management for product delivery
- **Quality Impact**: +60% better release coordination and stakeholder alignment
- **Time Investment**: 6-10 hours
- **Skip Impact**: Release coordination will need separate planning, stakeholder communication may be ad-hoc
- **Later Validation**: **Will enhance all downstream modules** - provides delivery context and timeline
- **Template**: `AgileAI/templates/product/ART-036-release-plan.md`

□ **ART-037: Sprint Goal**
- **Enhances in Product Planning**: Sprint-level focus and team alignment
- **Quality Impact**: +50% better sprint focus and team productivity
- **Time Investment**: 2-4 hours per sprint
- **Skip Impact**: Sprint planning will lack clear objectives, team focus may be scattered
- **Later Validation**: **Will be required by Development module** - creating now establishes good practices
- **Template**: `AgileAI/templates/product/ART-037-sprint-goal.md`

□ **ART-038: Sprint Backlog**
- **Enhances in Product Planning**: Detailed sprint execution and tracking
- **Quality Impact**: +40% better sprint execution and progress tracking
- **Time Investment**: 4-8 hours per sprint
- **Skip Impact**: Sprint execution will need separate detailed planning and tracking
- **Later Validation**: **Will be required by Development module** - creating now provides execution framework
- **Template**: `AgileAI/templates/product/ART-038-sprint-backlog.md`

□ **ART-039: Story Estimates**
- **Enhances in Product Planning**: Sprint planning and capacity management
- **Quality Impact**: +50% better sprint planning accuracy and team capacity utilization
- **Time Investment**: 4-6 hours for estimation sessions
- **Skip Impact**: Sprint planning will lack accurate capacity planning, velocity tracking will be difficult
- **Later Validation**: **Will be required by Development module** - creating now enables better planning
- **Template**: `AgileAI/templates/product/ART-039-story-estimates.md`

**Which optional artifacts would you like to create?**
```

The model MUST then ask: **"Please select which optional artifacts you want to create by listing their IDs (e.g., ART-028, ART-031, ART-036). Remember:**
- **User Experience artifacts** (ART-028, ART-031) dramatically improve story quality and development clarity
- **Release Management artifacts** (ART-036, ART-037, ART-038, ART-039) will be needed by Development module - creating now saves time and provides product context"

### Step 3: Context Reconstruction from Business Foundation

Read and summarize required Business Foundation artifacts to provide context for Product Planning work.

**Constraints:**
- The model MUST read all mandatory Business Foundation artifacts
- The model MUST extract key information needed for Product Planning
- The model MUST create context summary for use throughout Product Planning
- The model MUST identify any gaps or quality issues in Business Foundation artifacts

#### Step 3A: Business Foundation Context Extraction

The model MUST read and summarize:

```markdown
## Context Reconstruction from Business Foundation

### Step 3A-1: Read Business Requirements Document
**File**: `{project_dir}/business/business-requirements.md`
**Extract and Summarize**:
- **Target Customer**: [Primary customer type and characteristics]
- **Core Business Objectives**: [Top 3-5 business goals]
- **Functional Requirements**: [Key functional capabilities needed]
- **Business Rules**: [Critical business logic and constraints]
- **Success Metrics**: [How business success will be measured]
- **Scope Boundaries**: [What's in scope vs out of scope]

### Step 3A-2: Read Stakeholder Interviews
**File**: `{project_dir}/business/stakeholder-interviews.md`
**Extract and Summarize**:
- **Key Stakeholder Types**: [Business sponsors, end users, technical stakeholders]
- **Primary Pain Points**: [Top 3-5 problems stakeholders want solved]
- **Success Criteria**: [What stakeholders consider success]
- **User Needs**: [Specific user capabilities and workflows needed]
- **Constraints**: [Limitations or requirements from stakeholders]

### Step 3A-3: Read Business Case
**File**: `{project_dir}/business/business-case.md`
**Extract and Summarize**:
- **Business Value Proposition**: [Primary business value and ROI]
- **Investment and Timeline**: [Budget and timeline constraints]
- **Success Metrics**: [Business metrics for measuring success]
- **Risk Factors**: [Key risks that could affect product success]
- **Strategic Priorities**: [How this aligns with business strategy]

### Step 3A-4: Read Optional Enhancement Artifacts (if available)
**User Research** (`{project_dir}/business/user-research.md`):
- **User Personas**: [Key user types and characteristics]
- **User Journey Maps**: [Current and desired user workflows]
- **Pain Points**: [Specific user frustrations and needs]

**Market Analysis** (`{project_dir}/business/market-analysis.md`):
- **Market Opportunity**: [Market size and growth potential]
- **Competitive Landscape**: [Key competitors and market position]
- **Market Trends**: [Trends affecting product opportunity]

**Competitive Analysis** (`{project_dir}/business/competitive-analysis.md`):
- **Competitor Features**: [Key competitor capabilities]
- **Market Gaps**: [Opportunities for differentiation]
- **Competitive Advantages**: [How to position against competitors]
```

### Step 4: Product Planning Artifact Creation

Create selected Product Planning artifacts using Business Foundation context and appropriate templates.

**Constraints:**
- The model MUST create all mandatory artifacts plus selected optional artifacts
- For each artifact, the model MUST:
  1. Read the template from `AgileAI/templates/product/[ARTIFACT-ID].md`
  2. Use Business Foundation context to fill template sections
  3. Generate comprehensive content following template structure
  4. Embed key decisions made during the process
  5. Save the completed artifact to `{project_dir}/product/`

#### Step 4A: Create Mandatory Artifacts

##### Create ART-018: Product Roadmap
**Template Location**: `AgileAI/templates/product/ART-018-product-roadmap.md`

**Instructions:**
1. Read the template file above to understand the required structure
2. Use Business Case ROI data and timeline for roadmap phases
3. Use Business Requirements functional requirements for feature definition
4. Use Stakeholder Interviews for feature prioritization based on user value
5. Copy the template to `{project_dir}/product/product-roadmap.md`
6. Fill in all sections with business context:
   - **Product Vision**: Based on business objectives and value proposition
   - **Strategic Objectives**: From business case and stakeholder success criteria
   - **Feature Prioritization**: Using business value and user needs
   - **Timeline**: Aligned with business case timeline and constraints
7. Ensure all validation requirements are met

##### Create ART-019: Epics
**Template Location**: `AgileAI/templates/product/ART-019-epics.md`

**Instructions:**
1. Read the template file above to understand the required structure
2. Break down Product Roadmap features into manageable epics (3-12 months each)
3. Use Business Requirements for epic scope and acceptance criteria
4. Use Stakeholder Interviews for epic business value and user value
5. Copy the template to `{project_dir}/product/epics.md`
6. Create 3-7 epics covering the product roadmap scope:
   - **Epic Business Value**: From business case and stakeholder needs
   - **Epic User Value**: From stakeholder interviews and user research
   - **Epic Scope**: Based on functional requirements and business rules
   - **Epic Dependencies**: Based on business constraints and technical requirements
7. Ensure each epic has clear acceptance criteria and success metrics

##### Create ART-030: User Stories
**Template Location**: `AgileAI/templates/product/ART-030-user-stories.md`

**Instructions:**
1. Read the template file above to understand the required structure
2. Break down Epics into user stories following INVEST criteria
3. Use Business Requirements for functional story requirements
4. Use Stakeholder Interviews for user roles and story context
5. Use User Research (if available) for user personas and workflows
6. Copy the template to `{project_dir}/product/user-stories.md`
7. Create user stories for each epic:
   - **Story Format**: "As a [user] I want [functionality] so that [benefit]"
   - **Acceptance Criteria**: Given-When-Then format with clear pass/fail conditions
   - **Business Rules**: Incorporate relevant business rules from Business Foundation
   - **User Value**: Clear benefit statement based on stakeholder needs
8. Ensure stories are appropriately sized (1-8 story points) and testable

#### Step 4B: Create Selected Optional Artifacts

For each selected optional artifact, follow the same pattern:
1. Read the template from `AgileAI/templates/product/[ARTIFACT-ID].md`
2. Use Business Foundation context and mandatory Product Planning artifacts as input
3. Generate comprehensive content following template structure
4. Save to `{project_dir}/product/[artifact-name].md`

### Step 5: Product Planning Quality Validation

Validate that all Product Planning artifacts meet quality standards and are ready for Architecture module handoff.

**Constraints:**
- The model MUST validate each artifact against the validation requirements in its template
- The model MUST create a validation report at `{project_dir}/product/validation-report.md`
- The model MUST ensure all critical artifacts are complete before proceeding

```markdown
# Product Planning → Architecture Dependency Validation

## Mandatory Artifact Validation (Required for Architecture Module)

### ART-018: Product Roadmap
- **Status**: ✅ Complete / ⚠️ Issues Found / ❌ Missing
- **Architecture Readiness**: [Can Architecture module proceed with this artifact?]
- **Validation Results**: [Specific validation against template requirements]
- **Quality Score**: [1-5 rating] - [Brief explanation]
- **Key Context for Architecture**: [Most important roadmap information for system design]

### ART-019: Epics
- **Status**: ✅ Complete / ⚠️ Issues Found / ❌ Missing
- **Architecture Readiness**: [Can Architecture module proceed with this artifact?]
- **Validation Results**: [Specific validation against template requirements]
- **Quality Score**: [1-5 rating] - [Brief explanation]
- **Key Context for Architecture**: [Most important epic information for system scope]

### ART-030: User Stories
- **Status**: ✅ Complete / ⚠️ Issues Found / ❌ Missing
- **Architecture Readiness**: [Can Architecture module proceed with this artifact?]
- **Validation Results**: [Specific validation against template requirements]
- **Quality Score**: [1-5 rating] - [Brief explanation]
- **Key Context for Architecture**: [Most important story information for functional requirements]

## Architecture Module Readiness Assessment
- **Mandatory Dependencies**: [3/3] Complete ✅ / [X/3] Issues Found ⚠️
- **Ready to Proceed**: ✅ Yes / ❌ No - [Specific blocking issues]
- **Quality Enhancement Level**: [Assessment of optional artifacts selected]
- **Architecture Preparation**: [How well prepared for Architecture module work]
```

### Step 6: Smart Recommendations Based on Product Planning Results

Provide intelligent recommendations based on Product Planning artifact quality and Architecture module preparation.

**Constraints:**
- The model MUST analyze the Product Planning results and provide targeted recommendations
- The model MUST create a recommendations report at `{project_dir}/product/smart-recommendations.md`

```markdown
# Smart Recommendations Based on Product Planning Results

## Product Planning Quality Analysis
**Product Readiness Level**: [Analysis based on mandatory artifacts and optional selections]
**Architecture Preparation**: [How well prepared for Architecture & Design work]
**User Experience Readiness**: [Assessment of UX preparation for development]

## Selection Pattern Insights
**User Experience Focus**: [Analysis of UX-related artifact selections]
**Release Management Maturity**: [Analysis of release planning preparation]
**Development Readiness**: [How well prepared for development execution]

## Targeted Recommendations for Architecture Module

### CRITICAL (Strongly Consider Before Architecture)
[Recommendations for optional artifacts that would significantly improve Architecture outcomes]

### BENEFICIAL (Consider for Quality)
[Recommendations that would enhance Architecture planning quality]

### DEVELOPMENT PREPARATION (Consider for Efficiency)
[Recommendations for artifacts that will be needed by Development module]

## Decision Support for Architecture Module
**If you proceed with current Product Planning:**
- **Strengths**: [What your current artifacts provide to Architecture module]
- **Architecture Context**: [Quality of context available for system design]
- **Potential Gaps**: [Areas where Architecture module might need additional information]
- **Mitigation Strategies**: [How to address gaps during Architecture work]

**Recommendation**: [Proceed to Architecture/Add Critical Items/Enhance Product Planning]
**Rationale**: [Specific reasoning based on Product Planning analysis]
```

### Step 7: Architecture Module Handoff Preparation

Prepare comprehensive handoff summary for the Architecture & Design module.

**Constraints:**
- The model MUST create a complete handoff summary at `{project_dir}/handoffs/product-to-architecture.md`
- The model MUST include all essential information that Architecture module needs
- The model MUST validate that all mandatory cross-module dependencies are satisfied

```markdown
# Product Planning → Architecture & Design Handoff

## Handoff Status
- **Product Planning Module**: ✅ COMPLETE
- **Architecture Prerequisites**: ✅ SATISFIED
- **Handoff Date**: [DATE]
- **Next Module**: Architecture & Design

## Mandatory Artifacts Delivered (Required by Architecture)

### ART-018: Product Roadmap
- **Location**: `{project_dir}/product/product-roadmap.md`
- **Quality Score**: [1-5]
- **Key Context for Architecture**: [Product timeline, feature priorities, business milestones]
- **Usage in Architecture**: Use for system phasing, component prioritization, and scalability planning

### ART-019: Epics
- **Location**: `{project_dir}/product/epics.md`
- **Quality Score**: [1-5]
- **Key Context for Architecture**: [Epic scope, business value, acceptance criteria, dependencies]
- **Usage in Architecture**: Use for system boundary definition, component scope, and integration planning

### ART-030: User Stories
- **Location**: `{project_dir}/product/user-stories.md`
- **Quality Score**: [1-5]
- **Key Context for Architecture**: [Functional requirements, user workflows, acceptance criteria]
- **Usage in Architecture**: Use for detailed system design, API definition, and data model design

## Optional Artifacts Available (Quality Enhancement)
[List each optional artifact created and how Architecture can use it]

## Key Product Context for Architecture

### Product Vision and Strategy
- **Product Vision**: [Clear product vision statement]
- **Strategic Objectives**: [Key business objectives driving product development]
- **Success Metrics**: [How product success will be measured]

### User and Market Context
- **Target Users**: [Primary user types and characteristics]
- **User Workflows**: [Key user journeys and workflows]
- **Market Position**: [Competitive positioning and differentiation]

### Technical Requirements Context
- **Functional Requirements**: [Key functional capabilities needed]
- **Business Rules**: [Critical business logic that affects system design]
- **Integration Needs**: [External systems and data flows required]
- **Performance Expectations**: [User experience and performance requirements]

## Critical Product Decisions Made
[List major product decisions that will impact architecture design]

## Architecture Module Instructions
### Prerequisites Validation
Before starting Architecture & Design, verify:
1. Read Product Roadmap and understand feature priorities and timeline
2. Review Epics to understand system scope and major components needed
3. Analyze User Stories to understand detailed functional requirements and data flows
4. Confirm technical requirements align with business objectives

### Recommended Next Steps
1. Start Architecture module using `pdd-architecture.script.md`
2. Use Product Roadmap for system phasing and component prioritization
3. Reference Epics for system boundary and integration planning
4. Apply User Stories for detailed system design and API definition

## Development Module Preparation Status
[Assessment of how well prepared the project is for Development module based on optional artifacts created]
```

### Step 8: Final Module Status Update

Update the module status and provide clear next steps guidance.

**Constraints:**
- The model MUST update `{project_dir}/product/module-status.md` with final status
- The model MUST provide clear instructions for proceeding to Architecture module

## Success Criteria

The Product Planning module is considered complete when:
- ✅ All 3 mandatory artifacts (ART-018, ART-019, ART-030) are created and validated
- ✅ All selected optional artifacts meet quality standards
- ✅ Cross-module dependency validation shows Architecture can proceed
- ✅ Smart recommendations have been reviewed and addressed
- ✅ Handoff summary provides complete context for Architecture module
- ✅ All major product decisions are documented with rationale

## Notes for LLM Execution

**Cross-Module Dependency Focus:**
- Only validate dependencies needed by the immediate next module (Architecture)
- Clearly distinguish between "blocks next module" vs "enhances quality"
- Allow users to prepare for future modules without requiring it

**Hybrid Validation Approach:**
- Enforce mandatory Business Foundation prerequisites
- Provide smart recommendations for optional Business Foundation artifacts
- Explain quality impact of missing optional artifacts without blocking progress

**Progressive Validation:**
- Product Planning validates what it needs from Business Foundation
- Architecture will validate what it needs from Product Planning
- Development will validate what it needs from Architecture

**User Experience:**
- Keep mandatory list minimal and focused (3 artifacts)
- Explain why each artifact is mandatory for the next module specifically
- Show clear value of optional artifacts without overwhelming users
- Provide intelligent recommendations based on project type and selections

**Quality Assurance:**
- Use template validation requirements as quality gates
- Focus validation on readiness for next module
- Provide specific feedback on how artifacts will be used downstream
- Track preparation level for future modules

**Context Management:**
- Read and summarize all required Business Foundation artifacts
- Extract key information needed for Product Planning work
- Embed Business Foundation context throughout Product Planning artifacts
- Create comprehensive handoff context for Architecture module

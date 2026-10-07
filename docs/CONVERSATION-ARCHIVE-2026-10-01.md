# CONVERSATION ARCHIVE - 2026-10-01

## 1. Purpose and Current State of NEXTPHD
- **Purpose**: NEXTPHD is a single-user personal PhD intelligence system targeting Fall 2027.
- **State**: The project strictly follows `NEXTPHD_FINAL_BUILD_SPEC.md` as its authoritative product/architecture specification. All engineering is evidence-driven, requiring Phase 1 certification before moving forward.

## 2. Important Architectural Decisions
- Strict local development using Docker Desktop on Windows/WSL2 and the Supabase CLI.
- No workarounds involving manually bypassing critical architecture: migrations, RLS policies, seed data, and schema must remain exactly as designed in the spec.
- No redesigns or simplifications. The system must work correctly as intended.
- `[auth]` must remain enabled in `supabase/config.toml` because `seed.sql` and Phase 1 rely directly on the Supabase Auth schema. `[studio]` and `[local_smtp]` are currently temporarily disabled during debugging but will be restored.

## 3. Phase-by-Phase Decisions and Completed Work
- **Phase 0 & 0.5**: Complete.
- **Phase 1 (Database & Security Foundation)**: Implementation exists but is **NOT CERTIFIED**. Certification is currently blocked by underlying Docker runtime issues. No Phase 2 work is permitted.

## 4. Important Diagnostic Investigations & Results
We encountered two major, distinct infrastructure failures blocking Phase 1 certification:
1. **`exec format error` in Supabase Containers (Resolved):**
   - *Investigation*: Fresh Alpine binaries ran fine, but Supabase GoTrue and Mailpit failed to execute `/bin/sh`.
   - *Result*: Found a completely corrupted 0-byte `/bin/busybox` inside the shared Linux/amd64 Alpine layer for `supabase/gotrue:v2.197.0`. 
   - *Remediation*: Purged the corrupted cached images.

2. **`tls: bad record MAC` during Image Pulls (Identified Root Cause):**
   - *Investigation*: Large Supabase images (e.g. `postgres:17.6.1.171`) began failing to pull with a TLS MAC corruption error.
   - *Proxy Isolation*: Discovered that Docker Desktop's "Containerd Snapshotter" forces all internal pulls through a built-in caching proxy at `http.docker.internal:3128`. This ignores client-side `No Proxy` settings.
   - *Control Testing*: 
     - Small layers (`hello-world`, `alpine`, `python:3.12-slim` ~179MB) -> **SUCCESS**.
     - Massive layers (Supabase Postgres ~344MB, `tensorflow/tensorflow:latest` ~338.5MB) -> **FAILURE** with `tls: bad record MAC`.
   - *Result*: Proved definitively that the internal Containerd Proxy drops/corrupts the TLS stream specifically when handling individual tarball layers exceeding ~200-300MB.

## 5. Current Blockers
- Phase 1 certification cannot proceed until Docker can reliably pull the massive image layers required by `supabase/postgres`.

## 6. Exact Next Approved Action
- Disable **"Use containerd for pulling and storing images"** in the Docker Desktop UI Settings -> General.
- Apply & Restart Docker Desktop.
- Verify the storage driver using `docker info` (should revert to standard `overlayfs` without containerd proxy routing).
- Execute a final controlled pull of `docker pull tensorflow/tensorflow:latest` to prove the remediation works before pulling Supabase images.

## 7. Important Commands & Results
- `docker info`: Showed `Storage Driver: overlayfs / driver-type: io.containerd.snapshotter.v1` and `HTTP Proxy: http.docker.internal:3128`.
- `docker pull tensorflow/tensorflow:latest`: Acted as our critical control test. Failed exactly on layer `0cec44d3319b` (355,009,848 bytes) with `failed to copy: local error: tls: bad record MAC`.

## 8. Decisions That Must NOT Be Reversed or Repeated
- **DO NOT** delete all Docker volumes, caches, or perform a global factory reset.
- **DO NOT** change Windows, WSL2, MTU, Firewall, or DNS settings. The issue is purely internal to Docker's proxy buffering.
- **DO NOT** modify the NEXTPHD repository files (migrations, RLS, seed data) to work around these infrastructure failures.
- **DO NOT** attempt programmatic restarts of the Docker Desktop daemon on Windows (it causes the UI/daemon to hang).

## 9. Unresolved Questions
- Does reverting the Docker storage driver completely eliminate the TLS layer corruption issue?
- Once the image pulls successfully, are there any remaining configuration barriers preventing `supabase start` and `supabase db reset` from completing?

## 10. Recovery Instructions
If a new Antigravity session is started from this point, the agent MUST:
1. Read this archive file to immediately understand the context.
2. Ask the user to confirm whether they successfully unchecked **"Use containerd for pulling and storing images"** in Docker Desktop and restarted the engine.
3. Run `docker info` to verify that `driver-type: io.containerd.snapshotter.v1` is gone and the engine is using the legacy image store.
4. Run `docker pull tensorflow/tensorflow:latest` as the definitive control test.
5. If the pull succeeds, run `docker pull public.ecr.aws/supabase/postgres:17.6.1.171`.
6. Proceed to Phase 1 certification (`supabase start`, `supabase db reset`, `supabase test db`) ONLY after the images are successfully acquired.

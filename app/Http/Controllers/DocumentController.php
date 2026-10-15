<?php

namespace App\Http\Controllers;

use App\Models\KraSelfRating;
use App\Models\SignedIpcrf;
use App\Models\TeacherSubmission;
use App\Models\User;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Storage;

/**
 * Streams user-uploaded files (MOV PDFs, self-rating PDFs, signed IPCRFs,
 * profile photos) that live on the "public" disk (storage/app/public).
 *
 * Why this exists instead of the public/storage symlink:
 * Hostinger Single Web Hosting has no SSH, so `php artisan storage:link`
 * cannot be run and the symlink cannot be created through File Manager.
 * Requests to /storage/... therefore hit a path the web server refuses with
 * a bare 403. Routing files through PHP removes that dependency AND lets the
 * app's existing authentication / authorization decide who may read each file.
 *
 * Security model:
 *  - Every method receives a route-model-bound record (integer id in the URL).
 *    A missing id yields Laravel's 404 before any code here runs.
 *  - The path handed to the filesystem is the record's own `file_path` column,
 *    never a value from the URL, so path traversal is not possible.
 *  - Admin methods are additionally gated by the 'admin' middleware on the
 *    route group; teacher methods serve the authenticated teacher's own
 *    records only.
 */
class DocumentController extends Controller
{
    /* -------------------------------------------------------------------------
     | Admin  (routes/admin.php  ->  middleware: auth, admin)
     * ---------------------------------------------------------------------- */

    /** A teacher's MOV evidence PDF, for a rater. */
    public function submission(TeacherSubmission $submission): StreamedResponse
    {
        // Mirror rateTeacher(): a Master Teacher may only open Teacher-tier MOVs;
        // the Principal (super-admin) may open any.
        $tier = $submission->teacher?->ipcrfTier() ?? 'teacher';
        abort_unless(auth()->user()->canRateIpcrfTier($tier), 403);

        return $this->stream($submission->file_path);
    }

    /** A teacher's KRA self-rating PDF, seen from Questionnaire Results. */
    public function selfRating(KraSelfRating $selfRating): StreamedResponse
    {
        return $this->stream($selfRating->file_path);
    }

    /* -------------------------------------------------------------------------
     | Teacher  (routes/teacher.php  ->  middleware: auth, teacher)
     |   own records only
     * ---------------------------------------------------------------------- */

    public function ownSubmission(TeacherSubmission $submission): StreamedResponse
    {
        abort_unless($submission->teacher_id === auth()->id(), 403);

        return $this->stream($submission->file_path);
    }

    public function ownSelfRating(KraSelfRating $selfRating): StreamedResponse
    {
        abort_unless($selfRating->teacher_id === auth()->id(), 403);

        return $this->stream($selfRating->file_path);
    }

    public function ownSignedIpcrf(SignedIpcrf $signedIpcrf): StreamedResponse
    {
        abort_unless($signedIpcrf->teacher_id === auth()->id(), 403);

        return $this->stream($signedIpcrf->file_path);
    }

    /* -------------------------------------------------------------------------
     | Profile photo  (routes/web.php  ->  middleware: auth)
     * ---------------------------------------------------------------------- */

    /** Any signed-in user may see another user's avatar (shown in listings). */
    public function avatar(User $user): StreamedResponse
    {
        return $this->stream($user->profile_picture ?: $user->photo);
    }

    /* --------------------------------------------------------------------- */

    /**
     * Stream a file from the "public" disk inline, with the right MIME type.
     * 404 when the record has no file or the file is gone from storage.
     */
    private function stream(?string $relativePath): StreamedResponse
    {
        abort_if(
            blank($relativePath) || str_contains($relativePath, '..'),
            404
        );

        $disk = Storage::disk('public');
        abort_unless($disk->exists($relativePath), 404);

        // FilesystemAdapter::response() streams with a guessed Content-Type and
        // "Content-Disposition: inline", so PDFs/images preview in the browser.
        return $disk->response($relativePath, basename($relativePath));
    }
}

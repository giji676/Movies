import logging
from django.core.management.base import BaseCommand
from utils.convertToHLS import ConvertToHLS

class Command(BaseCommand):
    help = "Converts movies to HLS format. If TMDB_ID is given, only converts that one."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tmdb_id",
            type=int,
            help="TMDB ID of the movie to convert",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force conversion even if already converted",
        )
        parser.add_argument(
            "--mute",
            action="store_false",
            help="Mutes INFO logs, only shows WARNING and ERROR logs",
        )

    def handle(self, *args, **options):
        tmdb_id = options.get("tmdb_id")
        force = options.get("force")
        mute = options.get("mute")
        converter = ConvertToHLS(tmdb_id=tmdb_id, force=force, verbose=mute)
        converter.start()

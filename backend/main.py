from __future__ import print_function

import io
import string    
import random

from flask import Flask, request
from googleapiclient.errors import HttpError

from google_drive_service import GoogleDriveService
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

app = Flask(__name__)


# Allow for cross domain requests to access the endpoints by adding header to each API response
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.get('/getRootFolderInfo')
def get_root_folder_info():
    try:
        # Create drive api client
        google_drive_service = GoogleDriveService().build()
        files = []
        page_token = None
        while True:
            query_to_search_for_root_folder = f"mimeType = 'application/vnd.google-apps.folder' and name = 'Pagina Fotografia'"

            response = google_drive_service.files().list(q=query_to_search_for_root_folder,
                                                        spaces='drive',
                                                        fields="nextPageToken, files(id, name)",
                                                        pageToken=page_token
                                                        ).execute()

            for file in response.get('files', []):
                print(F'Found file: {file.get("name")}, {file.get("id")}')

            files.extend(response.get('files', []))
            page_token = response.get('nextPageToken', None)
            if page_token is None:
                break

    except HttpError as error:
        print(F'An error occurred: {error}')
        files = []

    return files


@app.get('/getAlbumsInfo/<root_folder_id>')
def get_albums_info(root_folder_id: str):
    try:
        # Create drive api client
        google_drive_service = GoogleDriveService().build()
        files = []
        page_token = None
        while True:
            # pylint: disable=maybe-no-member
            query_to_search_for_albums = f"mimeType = 'application/vnd.google-apps.folder' and '{root_folder_id}' in parents"
            response = (
                google_drive_service.files()
                .list(
                    q=query_to_search_for_albums,
                    spaces="drive",
                    fields="nextPageToken, files(id, name)",
                    pageToken=page_token,
                )
                .execute()
            )
            for file in response.get("files", []):
                # Process change
                print(f'Found file: {file.get("name")}, {file.get("id")}')
            files.extend(response.get("files", []))
            page_token = response.get("nextPageToken", None)
            if page_token is None:
                break

    except HttpError as error:
        print(f"An error occurred: {error}")
        files = None

    return files


@app.get('/getPhotosWithinAlbum/<album_id>')
def get_photos_within_album(album_id: str):
    try:
        # Create drive api client
        google_drive_service = GoogleDriveService().build()
        files = []
        page_token = None
        while True:
            # pylint: disable=maybe-no-member
            query_to_search_for_albums = f"mimeType='image/png' and '{album_id}' in parents"
            response = (
                google_drive_service.files()
                .list(
                    q=query_to_search_for_albums,
                    spaces="drive",
                    fields="nextPageToken, files(id, name, mimeType)",
                    pageToken=page_token,
                )
                .execute()
            )
            for file in response.get("files", []):
                # Process change
                print(f'Found file: {file.get("name")}, {file.get("id")}')
            files.extend(response.get("files", []))
            page_token = response.get("nextPageToken", None)
            if page_token is None:
                break

    except HttpError as error:
        print(f"An error occurred: {error}")
        files = None

    return files


@app.get('/getPhotoById/<photo_id>')
def get_photo_by_id(photo_id):
    try:
        # Create drive api client
        google_drive_service = GoogleDriveService().build()

        # pylint: disable=maybe-no-member
        request = google_drive_service.files().get_media(fileId=photo_id)
        file = io.BytesIO()
        downloader = MediaIoBaseDownload(file, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            print(F'Download {int(status.progress() * 100)}.')

    except HttpError as error:
        print(F'An error occurred: {error}')
        file = None

    return file.getvalue()


if __name__=='__main__':
    app.run(port=5000)